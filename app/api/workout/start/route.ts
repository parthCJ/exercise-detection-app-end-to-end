import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, collections } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { exerciseId, userId, userProfile } = await request.json()

    if (!exerciseId || !userId) {
      return NextResponse.json({ success: false, error: "Exercise ID and User ID are required" }, { status: 400 })
    }

    const db = await getDatabase()

    const workoutSession = {
      userId,
      exerciseId,
      startTime: new Date(),
      status: "active",
      reps: 0,
      duration: 0,
      calories: 0,
      userProfile,
      createdAt: new Date(),
    }

    const result = await db.collection(collections.workouts).insertOne(workoutSession)

    return NextResponse.json({
      success: true,
      session: {
        ...workoutSession,
        id: result.insertedId.toString(),
        startTime: workoutSession.startTime.toISOString(),
      },
      message: "Workout session started successfully",
    })
  } catch (error) {
    console.error("[v0] Error starting workout:", error)
    return NextResponse.json({ success: false, error: "Failed to start workout session" }, { status: 500 })
  }
}
