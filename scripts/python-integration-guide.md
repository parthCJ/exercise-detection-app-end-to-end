# Python Exercise Detection Integration Guide

This guide explains how to integrate your existing Python exercise detection scripts with the FitDetect web application.

## Overview

The web app sends camera frames to the `/api/python/execute` endpoint, which should call your Python scripts and return detection results.

## Expected Python Script Interface

Your Python scripts should accept the following inputs and return the specified outputs:

### Input Format
\`\`\`python
# The API will call your script with:
# - exercise_type: "pushups", "situps", "jumping-jacks", or "shuttle-run"
# - image_data: Base64 encoded JPEG image from camera
# - session_id: Unique workout session identifier
\`\`\`

### Expected Output Format
\`\`\`python
{
    "reps": 1,                    # Number of reps detected in this frame
    "formScore": 85,              # Form quality score (0-100)
    "feedback": "Keep your back straight",  # Real-time feedback message
    "confidence": 0.92,           # Detection confidence (0.0-1.0)
    "timestamp": "2024-01-01T12:00:00Z"
}
\`\`\`

## Integration Steps

### 1. Modify the API Route
Update `/app/api/python/execute/route.ts` to call your actual Python scripts:

\`\`\`typescript
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  const { exerciseType, sessionId, cameraData } = await request.json();
  
  // Call your Python script
  const pythonProcess = spawn('python', [
    `scripts/${exerciseType}_detection.py`,
    '--image', cameraData.imageData,
    '--session', sessionId
  ]);
  
  // Handle Python script output
  let result = '';
  pythonProcess.stdout.on('data', (data) => {
    result += data.toString();
  });
  
  pythonProcess.on('close', (code) => {
    if (code === 0) {
      const pythonResponse = JSON.parse(result);
      return NextResponse.json({
        success: true,
        data: pythonResponse
      });
    }
  });
}
\`\`\`

### 2. Python Script Template
Create your detection scripts following this template:

\`\`\`python
# pushup_detection.py
import sys
import json
import base64
import cv2
import numpy as np
from datetime import datetime

def detect_pushup(image_data):
    # Decode base64 image
    image_bytes = base64.b64decode(image_data.split(',')[1])
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Your existing detection logic here
    reps_detected = your_pushup_detection_function(frame)
    form_score = calculate_form_score(frame)
    feedback = generate_feedback(form_score)
    
    return {
        "reps": reps_detected,
        "formScore": form_score,
        "feedback": feedback,
        "confidence": 0.95,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    # Parse command line arguments
    image_data = sys.argv[sys.argv.index('--image') + 1]
    session_id = sys.argv[sys.argv.index('--session') + 1]
    
    # Run detection
    result = detect_pushup(image_data)
    
    # Output JSON result
    print(json.dumps(result))
\`\`\`

### 3. Required Python Dependencies
Make sure your Python environment has:
- opencv-python
- numpy
- Any ML libraries you're using (mediapipe, tensorflow, etc.)

### 4. File Structure
\`\`\`
scripts/
├── pushup_detection.py
├── situp_detection.py
├── jumping_jacks_detection.py
├── shuttle_run_detection.py
└── requirements.txt
\`\`\`

## Testing Your Integration

1. Start the web application
2. Go through the signup/profile setup flow
3. Select an exercise and start the camera
4. Click "Start Workout" to begin detection
5. Check browser console for detection results
6. Verify real-time stats update correctly

## Troubleshooting

- Check that Python scripts are executable
- Verify image data is being decoded correctly
- Ensure JSON output format matches exactly
- Test scripts independently before integration
- Check server logs for Python execution errors

## Performance Optimization

- Consider using a Python process pool for better performance
- Implement frame skipping if detection is too slow
- Cache model loading between requests
- Use GPU acceleration if available
