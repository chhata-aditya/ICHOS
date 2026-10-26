import cv2
import mediapipe as mp
import numpy as np


class HandDetector:
    """
    Detect up to two hands and return normalized landmarks.

    Each detected hand contains:
        - label: Left / Right
        - landmarks: 21 MediaPipe landmarks
    """

    def __init__(self):
        self._hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            model_complexity=0,
            min_detection_confidence=0.65,
            min_tracking_confidence=0.65,
        )

    def detect(self, jpeg_bytes):
        """
        Decode JPEG bytes and detect up to two hands.

        Returns:
            [
                {
                    "label": "Left",
                    "landmarks": [
                        {"x": ..., "y": ..., "z": ...},
                        ...
                    ]
                },
                ...
            ]

        Returns None if no hand is detected.
        """

        # Decode JPEG bytes into an OpenCV image
        image = cv2.imdecode(
            np.frombuffer(jpeg_bytes, np.uint8),
            cv2.IMREAD_COLOR,
        )

        if image is None:
            return None

        # OpenCV uses BGR.
        # MediaPipe expects RGB.
        rgb_image = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2RGB,
        )

        # Run MediaPipe
        result = self._hands.process(rgb_image)

        # No hands detected
        if not result.multi_hand_landmarks:
            return None

        hands = []

        handedness = result.multi_handedness or []

        # Process every detected hand
        for index, hand_landmarks in enumerate(
            result.multi_hand_landmarks
        ):
            landmarks = [
                {
                    "x": point.x,
                    "y": point.y,
                    "z": point.z,
                }
                for point in hand_landmarks.landmark
            ]

            # Determine Left / Right hand
            label = "Unknown"

            if index < len(handedness):
                label = (
                    handedness[index]
                    .classification[0]
                    .label
                )

            hands.append(
                {
                    "label": label,
                    "landmarks": landmarks,
                }
            )

        return hands

    def close(self):
        """
        Release MediaPipe resources.
        """

        self._hands.close()