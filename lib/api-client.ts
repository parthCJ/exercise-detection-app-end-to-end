// API client utility functions for frontend to backend communication

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UserProfile {
  id?: string
  email: string
  name: string
  height: number
  weight: number
  heightUnit: "cm" | "ft"
  weightUnit: "kg" | "lbs"
  age?: number
  fitnessLevel: "beginner" | "intermediate" | "advanced"
}

export interface WorkoutSession {
  id: string
  userId: string
  exerciseId: string
  startTime: string
  status: "active" | "paused" | "completed"
  reps: number
  duration: number
  calories: number
  userProfile: UserProfile
}

class ApiClient {
  private baseUrl = "/api"

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      return {
        success: false,
        error: "Network error occurred",
      }
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin)
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value)
        })
      }

      const response = await fetch(url.toString())
      const result = await response.json()
      return result
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      return {
        success: false,
        error: "Network error occurred",
      }
    }
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    return this.post("/auth", { action: "signin", email, password })
  }

  async signUp(email: string, password: string, name: string) {
    return this.post("/auth", { action: "signup", email, password, name })
  }

  // Profile methods
  async saveProfile(profile: UserProfile) {
    return this.post("/profile", profile)
  }

  async getProfile(userId: string) {
    return this.get("/profile", { userId })
  }

  // Exercise methods
  async getExercises(fitnessLevel?: string) {
    const params = fitnessLevel ? { fitnessLevel } : undefined
    return this.get("/exercises", params)
  }

  async getExercise(exerciseId: string) {
    return this.get("/exercises", { id: exerciseId })
  }

  // Workout methods
  async startWorkout(exerciseId: string, userId: string, userProfile: UserProfile) {
    return this.post<WorkoutSession>("/workout/start", { exerciseId, userId, userProfile })
  }

  async updateWorkout(sessionId: string, data: Partial<WorkoutSession>) {
    return this.post("/workout/update", { sessionId, ...data })
  }

  async endWorkout(sessionId: string, finalStats: any) {
    return this.post("/workout/end", { sessionId, finalStats })
  }

  // Python integration methods
  async executePythonScript(exerciseType: string, sessionId: string, cameraData?: any) {
    return this.post("/python/execute", { exerciseType, sessionId, cameraData })
  }
}

export const apiClient = new ApiClient()
