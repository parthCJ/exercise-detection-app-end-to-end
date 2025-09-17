import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, collections } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Profile API called")
    const profileData = await request.json()
    console.log("[v0] Profile data received:", profileData)

    // Validate required fields
    if (!profileData.email || !profileData.height || !profileData.weight) {
      console.log("[v0] Missing required fields:", {
        email: !!profileData.email,
        height: !!profileData.height,
        weight: !!profileData.weight,
      })
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Connecting to database...")
    const db = await getDatabase()
    console.log("[v0] Database connected successfully")

    console.log("[v0] Attempting to save profile for email:", profileData.email)
    const result = await db.collection(collections.profiles).findOneAndUpdate(
      { email: profileData.email },
      {
        $set: {
          ...profileData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    )

    console.log("[v0] Profile save result:", result.value ? "Success" : "Failed")

    return NextResponse.json({
      success: true,
      profile: {
        ...result.value,
        id: result.value._id.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Profile save error details:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to save profile: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const db = await getDatabase()

    const profile = await db.collection(collections.profiles).findOne({
      $or: [{ _id: new ObjectId(userId) }, { userId: userId }],
    })

    if (!profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        id: profile._id.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Profile fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 })
  }
}
