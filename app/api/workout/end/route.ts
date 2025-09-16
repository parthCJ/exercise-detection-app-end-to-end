import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, collections } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, finalStats } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    const workoutSummary = {
      endTime: new Date(),
      status: "completed",
      totalReps: finalStats?.reps || 0,
      totalDuration: finalStats?.duration || 0,
      caloriesBurned: finalStats?.calories || 0,
      averageFormScore: finalStats?.averageFormScore || 0,
      achievements: finalStats?.achievements || [],
      personalBests: finalStats?.personalBests || [],
      completedAt: new Date(),
    }

    const result = await db
      .collection(collections.workouts)
      .findOneAndUpdate({ _id: new ObjectId(sessionId) }, { $set: workoutSummary }, { returnDocument: "after" })

    if (!result.value) {
      return NextResponse.json({ success: false, error: "Workout session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      summary: {
        ...workoutSummary,
        sessionId,
        endTime: workoutSummary.endTime.toISOString(),
      },
      message: "Workout completed successfully!",
    })
  } catch (error) {
    console.error("[v0] Error ending workout:", error)
    return NextResponse.json({ success: false, error: "Failed to end workout session" }, { status: 500 })
  }
}
