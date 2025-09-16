import { type NextRequest, NextResponse } from "next/server"

const exercises = [
  {
    id: "pushups",
    name: "Push-ups",
    icon: "💪",
    description: "Build upper body strength with proper form detection",
    difficulty: "intermediate",
    duration: "5-15 min",
    calories: "50-150 cal",
    instructions: [
      "Start in plank position with hands shoulder-width apart",
      "Lower your body until chest nearly touches the floor",
      "Push back up to starting position",
      "Keep your body in a straight line throughout",
    ],
    tips: ["Keep your core engaged", "Don't let your hips sag", "Control the movement - don't rush"],
    pythonScript: "pushup_detection.py",
  },
  {
    id: "situps",
    name: "Sit-ups",
    icon: "🔥",
    description: "Core strengthening with AI-powered rep counting",
    difficulty: "beginner",
    duration: "5-10 min",
    calories: "30-80 cal",
    instructions: [
      "Lie on your back with knees bent",
      "Place hands behind your head or across chest",
      "Lift your torso up towards your knees",
      "Lower back down with control",
    ],
    tips: ["Don't pull on your neck", "Focus on using your abs", "Breathe out as you sit up"],
    pythonScript: "situp_detection.py",
  },
  {
    id: "jumping-jacks",
    name: "Jumping Jacks",
    icon: "⚡",
    description: "High-energy cardio workout with motion tracking",
    difficulty: "beginner",
    duration: "3-10 min",
    calories: "40-120 cal",
    instructions: [
      "Start standing with feet together, arms at sides",
      "Jump while spreading legs shoulder-width apart",
      "Simultaneously raise arms overhead",
      "Jump back to starting position",
    ],
    tips: ["Land softly on the balls of your feet", "Keep a steady rhythm", "Engage your core for stability"],
    pythonScript: "jumping_jacks_detection.py",
  },
  {
    id: "shuttle-run",
    name: "Shuttle Run",
    icon: "🏃",
    description: "Agility training with precise movement detection",
    difficulty: "advanced",
    duration: "5-15 min",
    calories: "60-180 cal",
    instructions: [
      "Set up two markers 10-20 feet apart",
      "Start at one marker in athletic position",
      "Sprint to the other marker and touch it",
      "Turn and sprint back to the starting marker",
    ],
    tips: ["Focus on quick direction changes", "Stay low when turning", "Use short, quick steps"],
    pythonScript: "shuttle_run_detection.py",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get("id")
    const fitnessLevel = searchParams.get("fitnessLevel")

    if (exerciseId) {
      const exercise = exercises.find((ex) => ex.id === exerciseId)
      if (!exercise) {
        return NextResponse.json({ success: false, error: "Exercise not found" }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        exercise,
      })
    }

    // Filter exercises based on fitness level if provided
    let filteredExercises = exercises
    if (fitnessLevel) {
      filteredExercises = exercises.filter((exercise) => {
        if (fitnessLevel === "beginner") {
          return exercise.difficulty === "beginner" || exercise.difficulty === "intermediate"
        } else if (fitnessLevel === "intermediate") {
          return exercise.difficulty === "intermediate" || exercise.difficulty === "advanced"
        }
        return true // Advanced users can do all exercises
      })
    }

    return NextResponse.json({
      success: true,
      exercises: filteredExercises,
      total: filteredExercises.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch exercises" }, { status: 500 })
  }
}
