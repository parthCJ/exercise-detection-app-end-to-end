import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { userId, exerciseType } = await request.json()

    if (!userId || !exerciseType) {
      return NextResponse.json({ success: false, error: "User ID and exercise type are required" }, { status: 400 })
    }

    console.log("[v0] Generating plot for user:", userId, "exercise:", exerciseType)

    const { db } = await connectToDatabase()
    const workouts = await db
      .collection("workouts")
      .find({
        userId: userId,
        exerciseType: exerciseType,
        status: "completed",
      })
      .sort({ createdAt: 1 })
      .toArray()

    if (workouts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No workout data found for plot generation",
        },
        { status: 404 },
      )
    }

    const plotData = workouts.map((workout) => ({
      date: workout.createdAt.toISOString().split("T")[0],
      reps: workout.totalReps || workout.reps || 0,
    }))

    const plotResult = await generatePlotWithPython(plotData)

    if (plotResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          plotImage: plotResult.plot_data,
          statistics: plotResult.statistics,
        },
        message: "Plot generated successfully",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: plotResult.error || "Failed to generate plot",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Error generating plot:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate workout plot",
      },
      { status: 500 },
    )
  }
}

async function generatePlotWithPython(workoutData: any[]): Promise<any> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), "scripts", "generate_pushup_plot.py")

    console.log("[v0] Spawning Python plot process:", scriptPath)

    const pythonProcess = spawn("python", [scriptPath], {
      cwd: process.cwd(),
    })

    let result = ""
    let errorOutput = ""

    // Send workout data to Python script via stdin
    pythonProcess.stdin.write(JSON.stringify(workoutData))
    pythonProcess.stdin.end()

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
      console.error("[v0] Python plot stderr:", data.toString())
    })

    pythonProcess.on("close", (code) => {
      console.log("[v0] Python plot process closed with code:", code)

      if (code === 0 && result.trim()) {
        try {
          const pythonResponse = JSON.parse(result.trim())
          console.log("[v0] Plot generation result:", pythonResponse.success ? "Success" : "Failed")
          resolve(pythonResponse)
        } catch (parseError) {
          console.error("[v0] Failed to parse Python plot output:", parseError)
          resolve({
            success: false,
            error: "Failed to parse plot generation output",
            plot_data: null,
            statistics: null,
          })
        }
      } else {
        console.error("[v0] Python plot script failed with code:", code)
        resolve({
          success: false,
          error: `Plot generation failed (code: ${code})`,
          plot_data: null,
          statistics: null,
        })
      }
    })

    pythonProcess.on("error", (error) => {
      console.error("[v0] Failed to spawn Python plot process:", error)
      resolve({
        success: false,
        error: "Failed to start plot generation script",
        plot_data: null,
        statistics: null,
      })
    })
  })
}
