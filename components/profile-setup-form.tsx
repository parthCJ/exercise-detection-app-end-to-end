"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ruler, Weight, User, ArrowRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface ProfileSetupFormProps {
  user: { email: string; name: string }
  onProfileComplete: (profile: UserProfile) => void
}

export interface UserProfile {
  email: string
  name: string
  height: number
  weight: number
  heightUnit: "cm" | "ft"
  weightUnit: "kg" | "lbs"
  age?: number
  fitnessLevel: "beginner" | "intermediate" | "advanced"
}

export function ProfileSetupForm({ user, onProfileComplete }: ProfileSetupFormProps) {
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    heightUnit: "cm" as "cm" | "ft",
    weightUnit: "kg" as "kg" | "lbs",
    age: "",
    fitnessLevel: "beginner" as "beginner" | "intermediate" | "advanced",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.height || !formData.weight) {
      alert("Please fill in your height and weight")
      return
    }

    setIsLoading(true)

    try {
      const profile: UserProfile = {
        email: user.email,
        name: user.name,
        height: Number.parseFloat(formData.height),
        weight: Number.parseFloat(formData.weight),
        heightUnit: formData.heightUnit,
        weightUnit: formData.weightUnit,
        age: formData.age ? Number.parseInt(formData.age) : undefined,
        fitnessLevel: formData.fitnessLevel,
      }

      const response = await apiClient.saveProfile(profile)

      if (response.success) {
        onProfileComplete(profile)
      } else {
        alert(response.error || "Failed to save profile")
      }
    } catch (error) {
      console.error("Profile save error:", error)
      alert("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FitDetect</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}!</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Profile</h1>
          <p className="text-xl text-gray-600">
            Help us personalize your fitness experience with some basic information.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              This information helps us provide accurate fitness tracking and personalized recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Height Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height *
                </Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder={formData.heightUnit === "cm" ? "170" : "5.7"}
                      step={formData.heightUnit === "cm" ? "1" : "0.1"}
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                      required
                    />
                  </div>
                  <Select
                    value={formData.heightUnit}
                    onValueChange={(value: "cm" | "ft") => handleInputChange("heightUnit", value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weight Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  Weight *
                </Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder={formData.weightUnit === "kg" ? "70" : "154"}
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      required
                    />
                  </div>
                  <Select
                    value={formData.weightUnit}
                    onValueChange={(value: "kg" | "lbs") => handleInputChange("weightUnit", value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Age Section (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-base font-semibold">
                  Age (Optional)
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  min="13"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div>

              {/* Fitness Level */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Fitness Level *</Label>
                <Select
                  value={formData.fitnessLevel}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                    handleInputChange("fitnessLevel", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - Just starting out</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Regular exercise</SelectItem>
                    <SelectItem value="advanced">Advanced - Experienced athlete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Setting up your profile..." : "Complete Profile"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Your information is secure and will only be used to enhance your fitness experience.
          </p>
        </div>
      </div>
    </div>
  )
}
