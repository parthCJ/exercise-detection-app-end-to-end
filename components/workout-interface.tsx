"use client"

import { useState, useEffect, useRef } from "react"
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Camera, CameraOff, Play, Square, ArrowLeft, Target, TrendingUp, AlertCircle } from "lucide-react"
import type { UserProfile } from "./profile-setup-form"
import type { Exercise } from "./exercise-selection"
import { apiClient } from "@/lib/api-client"

interface WorkoutInterfaceProps {
  exercise: Exercise
  userProfile: UserProfile
  onBack: () => void
  onWorkoutComplete: (summary: WorkoutSummary) => void
}

interface WorkoutSummary {
  totalReps: number
  duration: number
  caloriesBurned: number
  averageFormScore: number
  achievements: string[]
}

interface WorkoutStats {
  reps: number
  duration: number
  calories: number
  formScore: number
  isActive: boolean
  feedback: string[]
}

export function WorkoutInterface({ exercise, userProfile, onBack, onWorkoutComplete }: WorkoutInterfaceProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [workoutActive, setWorkoutActive] = useState(false)
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({
    reps: 0,
    duration: 0,
    calories: 0,
    formScore: 0,
    isActive: false,
    feedback: [],
  })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseCanvasRef = useRef<HTMLCanvasElement>(null)
  // Pose detection effect
  useEffect(() => {
    let detector: poseDetection.PoseDetector | null = null;
    let animationId: number;

    async function runPoseDetection() {
      await tf.setBackend('webgl');
      await tf.ready();
      detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
      detect();
    }

    async function detect() {
      if (videoRef.current && poseCanvasRef.current && detector) {
        poseCanvasRef.current.width = videoRef.current.videoWidth;
        poseCanvasRef.current.height = videoRef.current.videoHeight;
        const poses = await detector.estimatePoses(videoRef.current);
        drawPoses(poses, poseCanvasRef.current);
      }
      animationId = requestAnimationFrame(detect);
    }

    function drawPoses(poses: poseDetection.Pose[], canvas: HTMLCanvasElement) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      poses.forEach(pose => {
        // Draw keypoints
        pose.keypoints.forEach(kp => {
          if (kp.score && kp.score > 0.3) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          }
        });

        // Helper to get keypoint by name
        const getKp = (name: string) => pose.keypoints.find(k => k.name === name);

        // Draw and calculate for both arms
        const arms = [
          { s: 'right_shoulder', e: 'right_elbow', w: 'right_wrist', color: 'blue' },
          { s: 'left_shoulder', e: 'left_elbow', w: 'left_wrist', color: 'green' },
        ];
        arms.forEach(({ s, e, w, color }) => {
          const shoulder = getKp(s);
          const elbow = getKp(e);
          const wrist = getKp(w);
          if (
            shoulder && elbow && wrist &&
            shoulder.score !== undefined && shoulder.score > 0.3 &&
            elbow.score !== undefined && elbow.score > 0.3 &&
            wrist.score !== undefined && wrist.score > 0.3
          ) {
            // Draw lines
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(shoulder.x, shoulder.y);
            ctx.lineTo(elbow.x, elbow.y);
            ctx.lineTo(wrist.x, wrist.y);
            ctx.stroke();

            // Calculate angle
            const angle = calcAngle(shoulder, elbow, wrist);
            // Draw angle text
            ctx.fillStyle = color === 'blue' ? 'yellow' : 'lime';
            ctx.font = '20px Arial';
            ctx.fillText(`${Math.round(angle)}°`, elbow.x + 10, elbow.y - 10);
          }
        });
      });
    }

    // Helper to calculate angle between three points (shoulder, elbow, wrist)
    function calcAngle(a: any, b: any, c: any) {
      const ab = { x: a.x - b.x, y: a.y - b.y };
      const cb = { x: c.x - b.x, y: c.y - b.y };
      const dot = ab.x * cb.x + ab.y * cb.y;
      const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
      const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
      const cosine = dot / (magAB * magCB);
      return Math.acos(cosine) * (180 / Math.PI);
    }

    if (cameraActive) {
      runPoseDetection();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (detector) detector.dispose();
    };
  }, [cameraActive]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Initialize camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (error) {
      console.error("[v0] Camera access denied:", error)
      alert("Camera access is required for exercise detection. Please allow camera permissions.")
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  // Start workout session
  const startWorkout = async () => {
    if (!cameraActive) {
      alert("Please start the camera first")
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.startWorkout(exercise.id, userProfile.email, userProfile)

      if (response.success && response.session) {
        setSessionId(response.session.id)
        setWorkoutActive(true)
        startTimeRef.current = Date.now()

        setWorkoutStats((prev) => ({ ...prev, isActive: true }))

        if (exercise.id === "pushups") {
          await apiClient.resetPythonSession(exercise.id, response.session.id)
        }

        // Start the detection loop
        startDetectionLoop(response.session.id)

        console.log("[v0] Workout started successfully")
      } else {
        console.error("[v0] Failed to start workout:", response.error)
        alert("Failed to start workout session")
      }
    } catch (error) {
      console.error("[v0] Error starting workout:", error)
      alert("Error starting workout")
    } finally {
      setIsLoading(false)
    }
  }

  // Detection loop that calls your Python scripts
  const startDetectionLoop = (sessionId: string) => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return

      // Capture frame from video
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)

      // Convert canvas to base64 for sending to Python
      const imageData = canvas.toDataURL("image/jpeg", 0.8)

      try {
        // Call your Python exercise detection script
        const response = await apiClient.executePythonScript(exercise.id, sessionId, {
          imageData,
          timestamp: Date.now(),
        })

        if (response.success && response.data) {
          // Use type assertion for detection response
          const { reps, formScore, feedback, confidence, totalReps } = response.data as {
            reps?: number;
            formScore?: number;
            feedback?: string;
            confidence?: number;
            totalReps?: number;
          }

          const actualReps = exercise.id === "pushups" ? totalReps || 0 : workoutStats.reps + (reps || 0)

          // Update workout stats
          setWorkoutStats((prev) => {
            const newDuration = startTimeRef.current
              ? Math.floor((Date.now() - startTimeRef.current) / 1000)
              : prev.duration

            const newCalories = Math.floor(newDuration * 0.1 * (userProfile.weight / 70)) // Rough calculation

            return {
              ...prev,
              reps: actualReps,
              duration: newDuration,
              calories: newCalories,
              formScore: formScore || prev.formScore,
              feedback: feedback ? [feedback, ...prev.feedback.slice(0, 4)] : prev.feedback,
            }
          })

          // Update current feedback
          if (feedback && confidence && confidence > 0.8) {
            setCurrentFeedback(feedback)
            setTimeout(() => setCurrentFeedback(""), 3000)
          }

          // Update session on backend (allow formFeedback in payload)
          await apiClient.updateWorkout(sessionId, {
            reps: workoutStats.reps + (reps || 0),
            duration: startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0,
            // @ts-ignore
            formFeedback: feedback ? [feedback] : [],
          })
        }
      } catch (error) {
        console.error("[v0] Detection error:", error)
      }
    }, 1000) // Run detection every second
  }

  // Stop workout
  const stopWorkout = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }


    // Update duration one last time before ending
    let finalDuration = workoutStats.duration;
    if (workoutStats.isActive && startTimeRef.current) {
      finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setWorkoutStats((prev) => ({ ...prev, duration: finalDuration }));
    }

    if (sessionId) {
      try {
        const finalStats = {
          reps: workoutStats.reps,
          duration: finalDuration,
          calories: workoutStats.calories,
          averageFormScore: workoutStats.formScore,
          achievements: workoutStats.reps > 10 ? ["Great workout!"] : [],
          personalBests: [],
        }

        await apiClient.endWorkout(sessionId, finalStats)

        const summary: WorkoutSummary = {
          totalReps: workoutStats.reps,
          duration: finalDuration,
          caloriesBurned: workoutStats.calories,
          averageFormScore: workoutStats.formScore,
          achievements: finalStats.achievements,
        }

        onWorkoutComplete(summary)
      } catch (error) {
        console.error("[v0] Error ending workout:", error)
      }
    }

    setWorkoutActive(false)
    setWorkoutStats((prev) => ({ ...prev, isActive: false }))
    startTimeRef.current = null
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FitDetect</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-gradient-to-r from-orange-500 to-blue-600 text-white">{exercise.name} Workout</Badge>
            <Button variant="ghost" onClick={onBack} className="hover:bg-orange-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Exercise Detection
                </CardTitle>
                <CardDescription>Position yourself in front of the camera and start your workout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <div className="relative w-full h-full">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute top-0 left-0" />
                    <canvas ref={poseCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Overlay feedback */}
                  {currentFeedback && (
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          {currentFeedback}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Camera controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex gap-2">
                      {!cameraActive ? (
                        <Button onClick={startCamera} className="bg-green-600 hover:bg-green-700">
                          <Camera className="w-4 h-4 mr-2" />
                          Start Camera
                        </Button>
                      ) : (
                        <Button onClick={stopCamera} variant="outline" className="bg-white/90">
                          <CameraOff className="w-4 h-4 mr-2" />
                          Stop Camera
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workout controls */}
                <div className="flex justify-center gap-4 mt-6">
                  {!workoutActive ? (
                    <Button
                      onClick={startWorkout}
                      disabled={!cameraActive || isLoading}
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      {isLoading ? "Starting..." : "Start Workout"}
                    </Button>
                  ) : (
                    <Button onClick={stopWorkout} size="lg" variant="destructive">
                      <Square className="w-5 h-5 mr-2" />
                      End Workout
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Real-time Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Live Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{workoutStats.reps}</div>
                    <div className="text-sm text-gray-600">Reps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{formatTime(workoutStats.duration)}</div>
                    <div className="text-sm text-gray-600">Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{workoutStats.calories}</div>
                    <div className="text-sm text-gray-600">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{workoutStats.formScore}%</div>
                    <div className="text-sm text-gray-600">Form</div>
                  </div>
                </div>

                {workoutStats.formScore > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Form Score</span>
                      <span>{workoutStats.formScore}%</span>
                    </div>
                    <Progress value={workoutStats.formScore} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exercise Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="text-2xl">{exercise.icon}</div>
                  {exercise.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <Badge variant="outline">{exercise.difficulty}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{exercise.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Calories:</span>
                    <span>{exercise.calories}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            {workoutStats.feedback.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Recent Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workoutStats.feedback.slice(0, 3).map((feedback, index) => (
                      <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                        {feedback}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
