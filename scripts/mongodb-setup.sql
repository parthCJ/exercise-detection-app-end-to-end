// MongoDB Database Setup Guide for Fitness App
// Run these commands in MongoDB shell or MongoDB Compass

// 1. Create database and collections
use fitness_app

// 2. Create users collection with indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "createdAt": 1 })

// 3. Create profiles collection with indexes  
db.profiles.createIndex({ "email": 1 }, { unique: true })
db.profiles.createIndex({ "userId": 1 })

// 4. Create workouts collection with indexes
db.workouts.createIndex({ "userId": 1 })
db.workouts.createIndex({ "exerciseId": 1 })
db.workouts.createIndex({ "startTime": 1 })
db.workouts.createIndex({ "status": 1 })

// 5. Create exercises collection (optional - for custom exercises)
db.exercises.createIndex({ "id": 1 }, { unique: true })
db.exercises.createIndex({ "difficulty": 1 })

// 6. Insert sample exercises (optional)
db.exercises.insertMany([
  {
    id: "pushups",
    name: "Push-ups",
    description: "Build upper body strength with proper form detection",
    difficulty: "intermediate",
    duration: "5-15 min",
    calories: "50-150 cal",
    pythonScript: "pushup_detection.py",
    createdAt: new Date()
  },
  {
    id: "situps", 
    name: "Sit-ups",
    description: "Core strengthening with AI-powered rep counting",
    difficulty: "beginner",
    duration: "5-10 min", 
    calories: "30-80 cal",
    pythonScript: "situp_detection.py",
    createdAt: new Date()
  },
  {
    id: "jumping-jacks",
    name: "Jumping Jacks", 
    description: "High-energy cardio workout with motion tracking",
    difficulty: "beginner",
    duration: "3-10 min",
    calories: "40-120 cal", 
    pythonScript: "jumping_jacks_detection.py",
    createdAt: new Date()
  },
  {
    id: "shuttle-run",
    name: "Shuttle Run",
    description: "Agility training with precise movement detection", 
    difficulty: "advanced",
    duration: "5-15 min",
    calories: "60-180 cal",
    pythonScript: "shuttle_run_detection.py", 
    createdAt: new Date()
  }
])

console.log("MongoDB setup completed successfully!")
