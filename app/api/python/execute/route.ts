import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { exerciseType, sessionId, cameraData, action } = await request.json()

    if (!exerciseType || !sessionId) {
      return NextResponse.json({ success: false, error: "Exercise type and session ID are required" }, { status: 400 })
    }

    console.log("[v0] Executing Python script for:", exerciseType)
    console.log("[v0] Session ID:", sessionId)
    console.log("[v0] Action:", action || "detect")

    if (exerciseType === "pushups") {
      return await executePushupDetection(sessionId, cameraData, action)
    }

    // For other exercises, return mock data for now
    const mockPythonResponse = {
      reps: Math.floor(Math.random() * 3) + 1,
      formScore: Math.floor(Math.random() * 30) + 70,
      feedback: ["Keep your back straight", "Good form!", "Try to go slower on the way down"][
        Math.floor(Math.random() * 3)
      ],
      confidence: Math.random() * 0.3 + 0.7,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: mockPythonResponse,
      message: "Python script executed successfully",
    })
  } catch (error) {
    console.error("[v0] Error executing Python script:", error)
    return NextResponse.json({ success: false, error: "Failed to execute Python exercise detection" }, { status: 500 })
  }
}

async function executePushupDetection(sessionId: string, cameraData: any, action?: string): Promise<NextResponse> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), "scripts", "pushup_detection.py")

    // Build command arguments
    const args = ["--session", sessionId]

    if (action === "reset") {
      args.push("--reset")
    } else if (cameraData?.imageData) {
      args.push("--image", cameraData.imageData)
    } else {
      resolve(
        NextResponse.json(
          {
            success: false,
            error: "No image data provided",
          },
          { status: 400 },
        ),
      )
      return
    }

    console.log("[v0] Spawning Python process:", scriptPath)

    const pythonProcess = spawn("python", [scriptPath, ...args], {
      cwd: process.cwd(),
    })

    let result = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
      console.error("[v0] Python stderr:", data.toString())
    })

    pythonProcess.on("close", (code) => {
      console.log("[v0] Python process closed with code:", code)

      if (code === 0 && result.trim()) {
        try {
          const pythonResponse = JSON.parse(result.trim())
          console.log("[v0] Python detection result:", pythonResponse)

          resolve(
            NextResponse.json({
              success: true,
              data: pythonResponse,
              message: "Pushup detection completed successfully",
            }),
          )
        } catch (parseError) {
          console.error("[v0] Failed to parse Python output:", parseError)
          console.error("[v0] Raw output:", result)

          resolve(
            NextResponse.json(
              {
                success: false,
                error: "Failed to parse Python script output",
                details: result,
              },
              { status: 500 },
            ),
          )
        }
      } else {
        console.error("[v0] Python script failed with code:", code)
        console.error("[v0] Error output:", errorOutput)

        resolve(
          NextResponse.json(
            {
              success: false,
              error: `Python script execution failed (code: ${code})`,
              details: errorOutput,
            },
            { status: 500 },
          ),
        )
      }
    })

    pythonProcess.on("error", (error) => {
      console.error("[v0] Failed to spawn Python process:", error)
      resolve(
        NextResponse.json(
          {
            success: false,
            error: "Failed to start Python detection script",
            details: error.message,
          },
          { status: 500 },
        ),
      )
    })
  })
}
