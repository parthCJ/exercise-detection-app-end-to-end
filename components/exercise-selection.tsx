"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, ArrowLeft, Play, Clock, Target, Zap } from "lucide-react"
import type { UserProfile } from "./profile-setup-form"

interface ExerciseSelectionProps {
  userProfile: UserProfile
  onExerciseSelect: (exercise: Exercise) => void
  onBack: () => void
}

export interface Exercise {
  id: string
  name: string
  icon: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: string
  calories: string
  instructions: string[]
  tips: string[]
}

const exercises: Exercise[] = [
  {
    id: "pushups",
    name: "Push-ups",
    icon: "💪",
    description: "Build upper body strength with proper form detection",
    difficulty: "intermediate",
    duration: "5-15 min",
    calories: "50-150 cal",
    instructions: [
      "Start in plank position with hands shoulder-width apart",
      "Lower your body until chest nearly touches the floor",
      "Push back up to starting position",
      "Keep your body in a straight line throughout",
    ],
    tips: ["Keep your core engaged", "Don't let your hips sag", "Control the movement - don't rush"],
  },
  {
    id: "situps",
    name: "Sit-ups",
    icon: "🔥",
    description: "Core strengthening with AI-powered rep counting",
    difficulty: "beginner",
    duration: "5-10 min",
    calories: "30-80 cal",
    instructions: [
      "Lie on your back with knees bent",
      "Place hands behind your head or across chest",
      "Lift your torso up towards your knees",
      "Lower back down with control",
    ],
    tips: ["Don't pull on your neck", "Focus on using your abs", "Breathe out as you sit up"],
  },
  {
    id: "jumping-jacks",
    name: "Jumping Jacks",
    icon: "⚡",
    description: "High-energy cardio workout with motion tracking",
    difficulty: "beginner",
    duration: "3-10 min",
    calories: "40-120 cal",
    instructions: [
      "Start standing with feet together, arms at sides",
      "Jump while spreading legs shoulder-width apart",
      "Simultaneously raise arms overhead",
      "Jump back to starting position",
    ],
    tips: ["Land softly on the balls of your feet", "Keep a steady rhythm", "Engage your core for stability"],
  },
  {
    id: "shuttle-run",
    name: "Shuttle Run",
    icon: "🏃",
    description: "Agility training with precise movement detection",
    difficulty: "advanced",
    duration: "5-15 min",
    calories: "60-180 cal",
    instructions: [
      "Set up two markers 10-20 feet apart",
      "Start at one marker in athletic position",
      "Sprint to the other marker and touch it",
      "Turn and sprint back to the starting marker",
    ],
    tips: ["Focus on quick direction changes", "Stay low when turning", "Use short, quick steps"],
  },
]

export function ExerciseSelection({ userProfile, onExerciseSelect, onBack }: ExerciseSelectionProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRecommendedExercises = () => {
    return exercises.filter((exercise) => {
      if (userProfile.fitnessLevel === "beginner") {
        return exercise.difficulty === "beginner" || exercise.difficulty === "intermediate"
      } else if (userProfile.fitnessLevel === "intermediate") {
        return exercise.difficulty === "intermediate" || exercise.difficulty === "advanced"
      } else {
        return true // Advanced users can do all exercises
      }
    })
  }

  const recommendedExercises = getRecommendedExercises()

  if (selectedExercise) {
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
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Button variant="ghost" onClick={() => setSelectedExercise(null)} className="mb-6 hover:bg-orange-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exercise Selection
          </Button>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{selectedExercise.icon}</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{selectedExercise.name}</h1>
              <p className="text-xl text-gray-600">{selectedExercise.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Exercise Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Exercise Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Difficulty:</span>
                    <Badge className={getDifficultyColor(selectedExercise.difficulty)}>
                      {selectedExercise.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Duration:
                    </span>
                    <span className="text-sm">{selectedExercise.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Calories:
                    </span>
                    <span className="text-sm">{selectedExercise.calories}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>How to Perform</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {selectedExercise.instructions.map((instruction, index) => (
                      <li key={index} className="text-sm flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-orange-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Pro Tips</CardTitle>
                  <CardDescription>Follow these tips for better results and injury prevention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedExercise.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 px-8"
                onClick={() => onExerciseSelect(selectedExercise)}
              >
                <Play className="mr-2 w-5 h-5" />
                Start {selectedExercise.name}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
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
            <span className="text-sm text-gray-600">Welcome, {userProfile.name}!</span>
            <Button variant="ghost" onClick={onBack} className="hover:bg-orange-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Exercise</h1>
          <p className="text-xl text-gray-600">Select an exercise to start your AI-powered workout session</p>
          <div className="mt-4">
            <Badge className="bg-gradient-to-r from-orange-500 to-blue-600 text-white">
              Recommended for {userProfile.fitnessLevel} level
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {recommendedExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm"
              onClick={() => setSelectedExercise(exercise)}
            >
              <CardHeader className="text-center">
                <div className="text-5xl mb-3">{exercise.icon}</div>
                <CardTitle className="text-xl">{exercise.name}</CardTitle>
                <div className="flex justify-center">
                  <Badge className={getDifficultyColor(exercise.difficulty)}>{exercise.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <CardDescription className="text-sm">{exercise.description}</CardDescription>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {exercise.duration}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" />
                    {exercise.calories}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 border-orange-200 hover:bg-orange-50 bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedExercise(exercise)
                  }}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {exercises.length > recommendedExercises.length && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">All Exercises</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {exercises
                .filter((ex) => !recommendedExercises.includes(ex))
                .map((exercise) => (
                  <Card
                    key={exercise.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-0 bg-white/60 backdrop-blur-sm opacity-75"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <CardHeader className="text-center">
                      <div className="text-5xl mb-3">{exercise.icon}</div>
                      <CardTitle className="text-xl">{exercise.name}</CardTitle>
                      <div className="flex justify-center">
                        <Badge className={getDifficultyColor(exercise.difficulty)}>{exercise.difficulty}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-center space-y-3">
                      <CardDescription className="text-sm">{exercise.description}</CardDescription>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exercise.duration}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3" />
                          {exercise.calories}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 border-orange-200 hover:bg-orange-50 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedExercise(exercise)
                        }}
                      >
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
