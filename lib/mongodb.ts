import { MongoClient, type Db } from "mongodb"

const uri = "mongodb://localhost:27017"
const dbName = "fitness_app"

let client: MongoClient
let db: Db

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
  }
  return { client, db }
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
