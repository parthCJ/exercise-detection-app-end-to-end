import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  _id?: ObjectId
  email: string
  name: string
  height: number
  weight: number
  heightUnit: "cm" | "ft"
  weightUnit: "kg" | "lbs"
  age?: number
  fitnessLevel: "beginner" | "intermediate" | "advanced"
  userId?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface WorkoutSession {
  _id?: ObjectId
  userId: string
  exerciseId: string
  startTime: Date
  endTime?: Date
  status: "active" | "paused" | "completed"
  reps: number
  duration: number
  calories: number
  userProfile: UserProfile
  formFeedback?: string[]
  totalReps?: number
  totalDuration?: number
  caloriesBurned?: number
  averageFormScore?: number
  achievements?: string[]
  personalBests?: string[]
  createdAt?: Date
  lastUpdated?: Date
  completedAt?: Date
}

export interface Exercise {
  _id?: ObjectId
  id: string
  name: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: string
  calories: string
  instructions?: string[]
  tips?: string[]
  pythonScript: string
  createdAt?: Date
}
