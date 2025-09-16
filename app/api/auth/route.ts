import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, collections } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name } = await request.json()
    const db = await getDatabase()

    if (action === "signin") {
      if (email && password) {
        const user = await db.collection(collections.users).findOne({ email })

        if (!user) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
        }

        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
          return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          },
        })
      }
    } else if (action === "signup") {
      if (email && password && name) {
        // Check if user already exists
        const existingUser = await db.collection(collections.users).findOne({ email })
        if (existingUser) {
          return NextResponse.json({ success: false, error: "User already exists" }, { status: 409 })
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 12)
        const result = await db.collection(collections.users).insertOne({
          email,
          password: hashedPassword,
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        return NextResponse.json({
          success: true,
          user: {
            id: result.insertedId.toString(),
            email,
            name,
          },
        })
      }
    }

    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Authentication error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}
