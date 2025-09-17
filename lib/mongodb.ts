import { MongoClient, type Db } from "mongodb"

const uri = "mongodb://localhost:27017"
const dbName = "fitness_app"

let client: MongoClient
let db: Db

export async function connectToDatabase() {
  try {
    if (!client) {
      console.log("[v0] Connecting to MongoDB at:", uri)
      client = new MongoClient(uri)
      await client.connect()
      console.log("[v0] MongoDB connection established")
      db = client.db(dbName)
      console.log("[v0] Using database:", dbName)
    }
    return { client, db }
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error)
    throw error
  }
}

export async function getDatabase() {
  if (!db) {
    await connectToDatabase()
  }
  return db
}

// Database collections
export const collections = {
  users: "users",
  profiles: "profiles",
  workouts: "workouts",
  exercises: "exercises",
}
