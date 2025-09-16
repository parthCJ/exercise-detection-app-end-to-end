"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Timer, Zap, TrendingUp, CheckCircle, ArrowRight, Home } from "lucide-react"

interface WorkoutSummaryProps {
  summary: {
    totalReps: number
    duration: number
    caloriesBurned: number
    averageFormScore: number
    achievements: string[]
  }
  exerciseName: string
  onNewWorkout: () => void
  onHome: () => void
}

export function WorkoutSummary({ summary, exerciseName, onNewWorkout, onHome }: WorkoutSummaryProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getFormScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getFormScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 75) return "Good"
    if (score >= 60) return "Fair"
    return "Needs Improvement"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Workout Complete!</CardTitle>
          <CardDescription className="text-lg">Great job on your {exerciseName} session</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{summary.totalReps}</div>
              <div className="text-sm text-gray-600">Total Reps</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Timer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{formatTime(summary.duration)}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{summary.caloriesBurned}</div>
              <div className="text-sm text-gray-600">Calories</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className={`text-2xl font-bold ${getFormScoreColor(summary.averageFormScore)}`}>
                {summary.averageFormScore}%
              </div>
              <div className="text-sm text-gray-600">Form Score</div>
            </div>
          </div>

          {/* Form Analysis */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Form Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Overall Form Quality:</span>
                <div className="flex items-center gap-2">
                  <Badge className={`${getFormScoreColor(summary.averageFormScore)} bg-transparent border-current`}>
                    {getFormScoreLabel(summary.averageFormScore)}
                  </Badge>
                  <span className={`font-semibold ${getFormScoreColor(summary.averageFormScore)}`}>
                    {summary.averageFormScore}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          {summary.achievements.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={onNewWorkout}
              className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700"
            >
              Start New Workout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={onHome}
              variant="outline"
              className="flex-1 border-orange-200 hover:bg-orange-50 bg-transparent"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
