from collections import deque
from time import monotonic


class StaticGestureTracker:
    """
    Manages static pose state (OPEN PALM -> PLAY_PAUSE).

    Ensures that:
      1. Open palm requires holding steady for `hold_frames_required` frames (~250-300ms)
         before triggering, preventing swipes/flicks from triggering PLAY_PAUSE during motion.
      2. Fires exactly ONCE on confirmed hold.
      3. Enters WAIT_FOR_NEUTRAL state while the pose continues to be held.
      4. Requires the hand to transition through a confirmed NEUTRAL state (relaxed/curled hand
         or hand removal) for at least `neutral_frames_required` consecutive frames AND respect
         `cooldown` before allowing the pose to trigger again.
    """

    def __init__(self, cooldown=0.55, hold_frames_required=3, neutral_frames_required=2):
        self.cooldown = cooldown
        self.hold_frames_required = hold_frames_required
        self.neutral_frames_required = neutral_frames_required

        self.state = "READY"  # "READY" or "WAIT_FOR_NEUTRAL"
        self.last_triggered_time = 0.0
        self.hold_frame_count = 0
        self.neutral_frame_count = 0

    def update(self, detected_gesture, is_moving, now):
        """
        Update state machine with currently detected static gesture and motion state.
        detected_gesture: 'PLAY_PAUSE' or None (neutral)
        is_moving: True if hand is in active motion / flicking
        Returns: command string to emit, or None.
        """
        time_since_trigger = now - self.last_triggered_time

        # If hand is moving, reset hold counter (prevents flick from triggering static gesture)
        if is_moving:
            self.hold_frame_count = 0
            if self.state == "WAIT_FOR_NEUTRAL":
                self.neutral_frame_count += 1
            return None

        # ----------------------------------------------------
        # STATE: WAIT_FOR_NEUTRAL (holding or cooling down)
        # ----------------------------------------------------
        if self.state == "WAIT_FOR_NEUTRAL":
            if detected_gesture is None:
                self.neutral_frame_count += 1
                if (
                    self.neutral_frame_count >= self.neutral_frames_required
                    and time_since_trigger >= self.cooldown
                ):
                    self.state = "READY"
                    self.hold_frame_count = 0
            else:
                # If hand was neutral / absent and cooldown has elapsed, re-arm to READY
                if (
                    self.neutral_frame_count >= self.neutral_frames_required
                    and time_since_trigger >= self.cooldown
                ):
                    self.state = "READY"
                    self.hold_frame_count = 1
                else:
                    self.neutral_frame_count = 0
            return None

        # ----------------------------------------------------
        # STATE: READY (looking for confirmed stationary hold)
        # ----------------------------------------------------
        if detected_gesture is not None:
            if time_since_trigger >= self.cooldown:
                self.hold_frame_count += 1
                if self.hold_frame_count >= self.hold_frames_required:
                    self.state = "WAIT_FOR_NEUTRAL"
                    self.last_triggered_time = now
                    self.neutral_frame_count = 0
                    self.hold_frame_count = 0
                    return detected_gesture
        else:
            self.hold_frame_count = 0

        return None

    def reset_hand_lost(self, now):
        """Called when no hand is present in the frame."""
        self.hold_frame_count = 0
        self.neutral_frame_count += 1
        time_since_trigger = now - self.last_triggered_time
        if (
            self.neutral_frame_count >= self.neutral_frames_required
            and time_since_trigger >= self.cooldown
        ):
            self.state = "READY"

    def force_cooldown(self, now):
        """Force state into waiting/cooldown (e.g. after a swipe/flick triggers)."""
        self.state = "WAIT_FOR_NEUTRAL"
        self.last_triggered_time = now
        self.hold_frame_count = 0
        self.neutral_frame_count = 0


class GestureClassifier:
    """
    ICHOS Multimodal Gesture Classifier

    Supported Gestures:
      - FLICK / SWIPE RIGHT -> NEXT (horizontal rightward motion)
      - FLICK / SWIPE LEFT  -> PREVIOUS (horizontal leftward motion)
      - OPEN PALM           -> PLAY_PAUSE (hold steady for ~250ms, neutral reset required)
    """

    def __init__(self):
        # ==================================================
        # SWIPE / FLICK TRACKING & ANTI-JITTER
        # ==================================================
        self.positions = deque(maxlen=10)
        self.smoothed_x = None
        self.smoothed_y = None
        self.SMOOTHING_ALPHA = 0.80  # Responsive smoothing

        # Swipe/flick parameters (tuned for natural human webcam gestures at ~10 FPS)
        self.MIN_SWIPE_DISTANCE = 0.07  # 7% of screen width (effortless finger flick or swipe)
        self.MAX_SWIPE_TIME = 0.65      # Max duration of stroke in seconds
        self.MAX_VERTICAL_DEVIATION = 0.35  # Allows natural curved hand/finger arcs
        self.MIN_VELOCITY = 0.20        # Minimum velocity in units/sec

        # Speed threshold above which hand is moving (blocks static trigger)
        self.MOTION_SPEED_THRESHOLD = 0.22  # Normalized units / second

        self.last_swipe_time = 0.0
        self.SWIPE_COOLDOWN = 0.55  # 550ms cooldown after swipe

        # ==================================================
        # CENTRAL COMMAND COOLDOWN & STATIC TRACKER
        # ==================================================
        self.COMMAND_COOLDOWN = 0.55
        self.last_command_time = 0.0

        self.static_tracker = StaticGestureTracker(
            cooldown=self.COMMAND_COOLDOWN,
            hold_frames_required=3,  # ~300ms hold for intentional play/pause
            neutral_frames_required=2,
        )

    # ==================================================
    # TRACKING POINT & SMOOTHING
    # ==================================================

    @staticmethod
    def _compute_tracking_point(landmarks):
        """
        Track the weighted average of the wrist (0), index knuckle (5),
        index fingertip (8), and middle fingertip (12).
        This captures full-hand swipes, wrist tilts, and 2-finger flicks consistently.
        """
        cx = (
            landmarks[0]["x"]
            + landmarks[5]["x"]
            + landmarks[8]["x"]
            + landmarks[12]["x"]
        ) / 4.0
        cy = (
            landmarks[0]["y"]
            + landmarks[5]["y"]
            + landmarks[8]["y"]
            + landmarks[12]["y"]
        ) / 4.0
        return cx, cy

    def _update_position(self, cx, cy, now):
        """
        Apply Exponential Moving Average (EMA) smoothing.
        """
        if (
            self.smoothed_x is None
            or len(self.positions) == 0
            or (self.positions and now - self.positions[-1][0] > 0.30)
        ):
            self.smoothed_x = cx
            self.smoothed_y = cy
        else:
            self.smoothed_x = (
                self.SMOOTHING_ALPHA * cx
                + (1.0 - self.SMOOTHING_ALPHA) * self.smoothed_x
            )
            self.smoothed_y = (
                self.SMOOTHING_ALPHA * cy
                + (1.0 - self.SMOOTHING_ALPHA) * self.smoothed_y
            )

        self.positions.append((now, self.smoothed_x, self.smoothed_y))

    def _is_hand_moving(self):
        """
        Check if the hand is in active translation (preventing static pose triggers during a flick).
        """
        if len(self.positions) < 2:
            return False

        t_curr, x_curr, y_curr = self.positions[-1]
        t_prev, x_prev, y_prev = self.positions[-2]
        dt = t_curr - t_prev
        if dt <= 0:
            return False

        vx = (x_curr - x_prev) / dt
        vy = (y_curr - y_prev) / dt
        speed = (vx ** 2 + vy ** 2) ** 0.5
        return speed > self.MOTION_SPEED_THRESHOLD

    # ==================================================
    # SWIPE / FLICK DETECTION
    # ==================================================

    def _detect_swipe(self, now):
        """
        Analyze multi-frame trajectory for horizontal swipes or flicks.
        FLICK / SWIPE LEFT (decreasing X)  -> NEXT
        FLICK / SWIPE RIGHT (increasing X) -> PREVIOUS
        """
        if now - self.last_swipe_time < self.SWIPE_COOLDOWN:
            return None

        if len(self.positions) < 2:
            return None

        curr_time, curr_x, curr_y = self.positions[-1]

        # Scan candidate start points in recent trajectory window
        for start_time, start_x, start_y in list(self.positions)[:-1]:
            elapsed = curr_time - start_time

            if elapsed > self.MAX_SWIPE_TIME:
                continue

            dx = curr_x - start_x
            dy = curr_y - start_y
            abs_dx = abs(dx)
            abs_dy = abs(dy)

            # Check minimum horizontal displacement (effortless flick)
            if abs_dx < self.MIN_SWIPE_DISTANCE:
                continue

            # Vertical tolerance
            if abs_dy > self.MAX_VERTICAL_DEVIATION:
                continue

            # Velocity check
            if elapsed > 0 and (abs_dx / elapsed) < self.MIN_VELOCITY:
                continue

            # Command direction: flick/swipe right -> NEXT, flick/swipe left -> PREVIOUS
            cmd = "NEXT" if dx > 0 else "PREVIOUS"

            self.last_swipe_time = now
            self.positions.clear()
            self.smoothed_x = None
            self.smoothed_y = None
            self.static_tracker.force_cooldown(now)
            return cmd

        return None

    # ==================================================
    # STATIC GESTURE EVALUATION
    # ==================================================

    @staticmethod
    def _is_finger_extended(hand, tip_idx, pip_idx):
        """
        Check if a finger is extended upwards.
        In image space, Y=0 is top, Y=1 is bottom.
        Tip Y < PIP Y indicates extended upwards.
        """
        wrist = hand[0]
        is_above = hand[tip_idx]["y"] < hand[pip_idx]["y"]
        d_tip_sq = (hand[tip_idx]["x"] - wrist["x"]) ** 2 + (
            hand[tip_idx]["y"] - wrist["y"]
        ) ** 2
        d_pip_sq = (hand[pip_idx]["x"] - wrist["x"]) ** 2 + (
            hand[pip_idx]["y"] - wrist["y"]
        ) ** 2
        return is_above and (d_tip_sq > d_pip_sq * 0.85)

    def _is_open_palm(self, hand):
        """All 4 fingers (index, middle, ring, pinky) extended upwards."""
        index = self._is_finger_extended(hand, 8, 6)
        middle = self._is_finger_extended(hand, 12, 10)
        ring = self._is_finger_extended(hand, 16, 14)
        pinky = self._is_finger_extended(hand, 20, 18)
        return index and middle and ring and pinky

    def _identify_static_gesture(self, hand):
        if self._is_open_palm(hand):
            return "PLAY_PAUSE"
        return None

    # ==================================================
    # HAND SELECTION
    # ==================================================

    @staticmethod
    def _select_hand(hands):
        """Prefer the right hand if detected, otherwise the first valid hand."""
        if not hands:
            return None
        for detected_hand in hands:
            landmarks = detected_hand.get("landmarks")
            if landmarks and len(landmarks) == 21 and detected_hand.get("label") == "Right":
                return landmarks
        for detected_hand in hands:
            landmarks = detected_hand.get("landmarks")
            if landmarks and len(landmarks) == 21:
                return landmarks
        return None

    # ==================================================
    # MAIN CLASSIFIER
    # ==================================================

    def classify(self, hands):
        """
        Classify incoming hand detections into player commands.
        Returns command string or None.
        """
        now = monotonic()

        # Check central command cooldown
        if now - self.last_command_time < self.COMMAND_COOLDOWN:
            if not hands:
                self._handle_no_hand(now)
            else:
                hand = self._select_hand(hands)
                if hand is not None:
                    cx, cy = self._compute_tracking_point(hand)
                    self._update_position(cx, cy, now)
            return None

        # Handle no hand in frame
        if not hands:
            self._handle_no_hand(now)
            return None

        hand = self._select_hand(hands)
        if hand is None:
            self._handle_no_hand(now)
            return None

        cx, cy = self._compute_tracking_point(hand)
        self._update_position(cx, cy, now)

        # 1. SWIPE / FLICK FIRST: Evaluated across trajectory
        swipe_cmd = self._detect_swipe(now)
        if swipe_cmd:
            self.last_command_time = now
            return swipe_cmd

        # 2. STATIC GESTURE: Evaluated with hold-to-confirm and motion gating
        is_moving = self._is_hand_moving()
        detected_static = self._identify_static_gesture(hand)
        static_cmd = self.static_tracker.update(detected_static, is_moving, now)
        if static_cmd:
            self.last_command_time = now
            return static_cmd

        return None

    def _handle_no_hand(self, now):
        """Reset trajectory buffer and inform static tracker when hand is absent."""
        self.positions.clear()
        self.smoothed_x = None
        self.smoothed_y = None
        self.static_tracker.reset_hand_lost(now)

