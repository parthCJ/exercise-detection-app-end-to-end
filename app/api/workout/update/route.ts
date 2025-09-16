import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, collections } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, reps, duration, calories, formFeedback } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    const result = await db.collection(collections.workouts).findOneAndUpdate(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          reps: reps || 0,
          duration: duration || 0,
          calories: calories || 0,
          formFeedback: formFeedback || [],
          lastUpdated: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result.value) {
      return NextResponse.json({ success: false, error: "Workout session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session: {
        ...result.value,
        id: result.value._id.toString(),
      },
      message: "Workout session updated successfully",
    })
  } catch (error) {
    console.error("[v0] Error updating workout:", error)
    return NextResponse.json({ success: false, error: "Failed to update workout session" }, { status: 500 })
  }
}
