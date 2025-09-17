"use client"

import { useState, useEffect, useRef } from "react"
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

      if (response.success && response.data) {
        setSessionId(response.data.id)
        setWorkoutActive(true)
        startTimeRef.current = Date.now()

        setWorkoutStats((prev) => ({ ...prev, isActive: true }))

        if (exercise.id === "pushups") {
          await apiClient.resetPythonSession(exercise.id, response.data.id)
        }

        // Start the detection loop
        startDetectionLoop(response.data.id)

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
          const { reps, formScore, feedback, confidence, totalReps } = response.data

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
          if (feedback && confidence > 0.8) {
            setCurrentFeedback(feedback)
            setTimeout(() => setCurrentFeedback(""), 3000)
          }

          // Update session on backend
          await apiClient.updateWorkout(sessionId, {
            reps: workoutStats.reps + (reps || 0),
            duration: startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0,
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

    if (sessionId) {
      try {
        const finalStats = {
          reps: workoutStats.reps,
          duration: workoutStats.duration,
          calories: workoutStats.calories,
          averageFormScore: workoutStats.formScore,
          achievements: workoutStats.reps > 10 ? ["Great workout!"] : [],
          personalBests: [],
        }

        await apiClient.endWorkout(sessionId, finalStats)

        const summary: WorkoutSummary = {
          totalReps: workoutStats.reps,
          duration: workoutStats.duration,
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
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />

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
