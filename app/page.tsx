"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Zap, Target, Users, ArrowRight, Play, CheckCircle } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { ProfileSetupForm, type UserProfile } from "@/components/profile-setup-form"
import { ExerciseSelection, type Exercise } from "@/components/exercise-selection"
import { WorkoutInterface } from "@/components/workout-interface"
import { WorkoutSummary } from "@/components/workout-summary"

interface WorkoutSummaryData {
  totalReps: number
  duration: number
  caloriesBurned: number
  averageFormScore: number
  achievements: string[]
}

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showExerciseSelection, setShowExerciseSelection] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummaryData | null>(null)

  const exercises = [
    {
      name: "Push-ups",
      icon: "💪",
      description: "Build upper body strength",
      difficulty: "Beginner",
      duration: "3 minutes",
    },
    {
      name: "Sit-ups",
      icon: "🔥",
      description: "Core strengthening",
      difficulty: "Intermediate",
      duration: "5 minutes",
    },
    { name: "Jumping Jacks", icon: "⚡", description: "Cardio workout", difficulty: "Beginner", duration: "2 minutes" },
    { name: "Shuttle Run", icon: "🏃", description: "Agility training", difficulty: "Advanced", duration: "4 minutes" },
  ]

  const features = [
    {
      icon: Activity,
      title: "AI-Powered Detection",
      description: "Advanced computer vision tracks your form in real-time",
    },
    { icon: Target, title: "Precise Counting", description: "Accurate rep counting for every exercise" },
    { icon: Zap, title: "Instant Feedback", description: "Get immediate form corrections and tips" },
    { icon: Users, title: "Progress Tracking", description: "Monitor your fitness journey over time" },
  ]

  const handleAuthSuccess = (userData: { email: string; name: string }) => {
    setUser(userData)
    setIsAuthOpen(false)
  }

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile)
  }

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise)
  }

  const handleWorkoutComplete = (summary: WorkoutSummaryData) => {
    setWorkoutSummary(summary)
    setSelectedExercise(null)
  }

  const handleNewWorkout = () => {
    setWorkoutSummary(null)
    setShowExerciseSelection(true)
  }

  const handleBackToHome = () => {
    setWorkoutSummary(null)
    setSelectedExercise(null)
    setShowExerciseSelection(false)
  }

  const handleSignOut = () => {
    setUser(null)
    setUserProfile(null)
    setShowExerciseSelection(false)
    setSelectedExercise(null)
    setWorkoutSummary(null)
  }

  if (workoutSummary) {
    return (
      <WorkoutSummary
        summary={workoutSummary}
        exerciseName={selectedExercise?.name || "Exercise"}
        onNewWorkout={handleNewWorkout}
        onHome={handleBackToHome}
      />
    )
  }

  if (selectedExercise && userProfile) {
    return (
      <WorkoutInterface
        exercise={selectedExercise}
        userProfile={userProfile}
        onBack={() => setSelectedExercise(null)}
        onWorkoutComplete={handleWorkoutComplete}
      />
    )
  }

  if (user && !userProfile) {
    return <ProfileSetupForm user={user} onProfileComplete={handleProfileComplete} />
  }

  if (userProfile && showExerciseSelection) {
    return (
      <ExerciseSelection
        userProfile={userProfile}
        onExerciseSelect={handleExerciseSelect}
        onBack={() => setShowExerciseSelection(false)}
      />
    )
  }

  if (userProfile) {
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
              <span className="text-sm text-gray-600">Welcome, {userProfile.name}!</span>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="border-orange-200 hover:bg-orange-50 bg-transparent"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Ready to Start Training!</h1>
            <p className="text-xl text-gray-600">
              Your profile is complete. Choose an exercise to begin your AI-powered workout.
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Ready to start your personalized workout experience.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>
                  <strong>Height:</strong> {userProfile.height} {userProfile.heightUnit}
                </p>
                <p>
                  <strong>Weight:</strong> {userProfile.weight} {userProfile.weightUnit}
                </p>
                <p>
                  <strong>Fitness Level:</strong> {userProfile.fitnessLevel}
                </p>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700"
                onClick={() => setShowExerciseSelection(true)}
              >
                Choose Exercise
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FitDetect</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsAuthOpen(true)}
            className="border-orange-200 hover:bg-orange-50"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-blue-600 text-white border-0">
            AI-Powered Fitness
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Perfect Your Form with
            <span className="bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
              {" "}
              AI Detection
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 text-pretty max-w-2xl mx-auto">
            Transform your workouts with real-time exercise detection. Get accurate rep counting, form feedback, and
            personalized insights for push-ups, sit-ups, jumping jacks, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 text-white px-8"
              onClick={() => setIsAuthOpen(true)}
            >
              Start Training Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-50 bg-transparent">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Exercise Cards */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Supported Exercises</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exercises.map((exercise, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="text-4xl mb-2">{exercise.icon}</div>
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{exercise.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose FitDetect?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Workouts?</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have improved their fitness with AI-powered exercise detection.
          </p>
          <Button
            size="lg"
            className="bg-white text-orange-600 hover:bg-gray-100 px-8"
            onClick={() => setIsAuthOpen(true)}
          >
            Get Started Free
            <CheckCircle className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-blue-600 rounded flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold">FitDetect</span>
          </div>
          <p className="text-gray-400">© 2024 FitDetect. All rights reserved.</p>
        </div>
      </footer>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={handleAuthSuccess} />
    </div>
  )
}
