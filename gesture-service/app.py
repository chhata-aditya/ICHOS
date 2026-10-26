import asyncio
from time import monotonic

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from detection.gesture_classifier import GestureClassifier
from detection.hand_detector import HandDetector


app = FastAPI(
    title="ICHOS Gesture Service"
)

MAX_FRAME_BYTES = 1_000_000
COMMAND_COOLDOWN_SECONDS = 0.6


@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "ichos-gesture",
    }


@app.websocket("/ws")
async def gesture_socket(
    websocket: WebSocket
):

    await websocket.accept()

    detector = HandDetector()
    classifier = GestureClassifier()

    last_command = None
    last_command_at = 0.0

    try:

        while True:

            # ==========================================
            # RECEIVE FRAME
            # ==========================================

            packet = await websocket.receive()

            if packet.get("type") == "websocket.disconnect":
                break

            frame = packet.get("bytes")

            if not frame or len(frame) > MAX_FRAME_BYTES:
                continue

            # ==========================================
            # DETECT HAND
            # ==========================================

            try:
                hands = await asyncio.to_thread(
                    detector.detect,
                    frame,
                )
            except Exception as error:
                # A malformed image or transient MediaPipe failure must not
                # close the browser's camera/WebSocket session.
                print(f"Skipping invalid gesture frame: {error}")
                continue

            if not hands:
                classifier.classify(None)
                continue

            # ==========================================
            # CLASSIFY
            # ==========================================

            try:
                result = classifier.classify(
                    hands
                )
            except Exception as error:
                print(f"Skipping gesture classification error: {error}")
                continue

            if not result:

                continue

            # ==========================================
            # COMMAND
            # ==========================================

            message = {
                "type": "PLAYER_COMMAND",
            }

            if isinstance(result, str):
                message["command"] = result
            elif isinstance(result, dict):
                message["command"] = result.get("command")
                if result.get("command") == "SET_VOLUME":
                    value = result.get("value")
                    if not isinstance(value, (int, float)):
                        continue
                    message["value"] = max(0.0, min(1.0, float(value)))
            else:
                continue

            command = message.get("command")

            if not isinstance(command, str):

                continue

            # ==========================================
            # SAFETY COOLDOWN
            # ==========================================

            now = monotonic()

            if now - last_command_at < COMMAND_COOLDOWN_SECONDS:
                continue

            last_command = command
            last_command_at = now

            # ==========================================
            # LOG
            # ==========================================

            print(f"Gesture detected: {command}")

            # ==========================================
            # SEND TO REACT
            # ==========================================

            await websocket.send_json(message)

    except WebSocketDisconnect:

        print(
            "Gesture client disconnected."
        )

    except Exception as error:
        # Connection-level failures are logged; per-frame failures are handled
        # above so one bad frame cannot disconnect a healthy camera session.
        print(f"Gesture service connection error: {error}")

    finally:

        detector.close()
