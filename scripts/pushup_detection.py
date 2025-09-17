import cv2
import mediapipe as mp
import numpy as np
import json
import sys
import base64
from datetime import datetime
import io
from PIL import Image

# Initialize MediaPipe Pose solution
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

def calculate_angle(a, b, c):
    """Calculates the angle of a joint given three landmark points."""
    a = np.array(a)  # First point
    b = np.array(b)  # Mid point
    c = np.array(c)  # End point

    # converting the angles to the radians.
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)

    if angle > 180.0:
        angle = 360 - angle

    return angle

# Global state for pushup counting
pushup_state = "up"
pushup_count = 0

def detect_pushup_from_frame(image_data, session_id):
    """Process a single frame for pushup detection"""
    global pushup_state, pushup_count
    
    try:
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Flip the image horizontally for a selfie-view display
        frame = cv2.flip(frame, 1)
        
        # Convert BGR to RGB for MediaPipe
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        reps_this_frame = 0
        form_score = 0
        feedback = "Position yourself in the camera view"
        confidence = 0.0
        
        with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
            results = pose.process(frame_rgb)
            
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                confidence = 0.9
                
                # Get coordinates for the right arm
                shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x,
                           landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y]
                elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].x, 
                        landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].y]
                wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].x, 
                        landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y]
                
                # Calculate elbow angle
                angle = calculate_angle(shoulder, elbow, wrist)
                
                # Form scoring based on angle
                if 80 <= angle <= 100:
                    form_score = 95
                    feedback = "Perfect form! Keep it up!"
                elif 70 <= angle <= 110:
                    form_score = 85
                    feedback = "Good form, slight adjustment needed"
                elif 60 <= angle <= 120:
                    form_score = 70
                    feedback = "Moderate form, focus on your elbow angle"
                else:
                    form_score = 50
                    feedback = "Poor form, check your arm position"
                
                # Push-up counting logic
                if angle < 90:
                    pushup_state = "down"
                if angle > 160 and pushup_state == "down":
                    pushup_state = "up"
                    pushup_count += 1
                    reps_this_frame = 1
                    feedback = f"Great! Rep #{pushup_count} completed!"
            else:
                feedback = "Please position yourself in the camera view"
                confidence = 0.1
        
        return {
            "reps": reps_this_frame,
            "formScore": form_score,
            "feedback": feedback,
            "confidence": confidence,
            "totalReps": pushup_count,
            "currentAngle": angle if 'angle' in locals() else 0,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "reps": 0,
            "formScore": 0,
            "feedback": f"Detection error: {str(e)}",
            "confidence": 0.0,
            "totalReps": pushup_count,
            "currentAngle": 0,
            "timestamp": datetime.now().isoformat()
        }

def reset_session():
    """Reset the pushup counter for a new session"""
    global pushup_state, pushup_count
    pushup_state = "up"
    pushup_count = 0

if __name__ == "__main__":
    try:
        # Parse command line arguments
        image_data = sys.argv[sys.argv.index('--image') + 1]
        session_id = sys.argv[sys.argv.index('--session') + 1]
        
        # Check if this is a reset command
        if '--reset' in sys.argv:
            reset_session()
            result = {"message": "Session reset", "totalReps": 0}
        else:
            # Run detection
            result = detect_pushup_from_frame(image_data, session_id)
        
        # Output JSON result
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "reps": 0,
            "formScore": 0,
            "feedback": f"Script error: {str(e)}",
            "confidence": 0.0,
            "totalReps": 0,
            "currentAngle": 0,
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result))
