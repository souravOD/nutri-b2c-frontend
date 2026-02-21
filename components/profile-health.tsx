"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { StickySaveBar } from "@/components/sticky-save-bar"
import { UnsavedChangesPrompt } from "@/components/unsaved-changes-prompt"
import type { User } from "@/lib/mock-auth"

interface ProfileHealthProps {
  user: User
}

const DIETS = ["Vegan", "Vegetarian", "Keto", "Paleo", "Low-carb", "High-protein", "Mediterranean", "Gluten-free"]
const ALLERGENS = ["Milk", "Egg", "Fish", "Shellfish", "Tree nuts", "Peanuts", "Wheat/Gluten", "Soy", "Sesame"]

export function ProfileHealth({ user }: ProfileHealthProps) {
  const { updateUser } = useUser()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [formData, setFormData] = useState<Partial<User>>({
    dateOfBirth: user.dateOfBirth,
    sex: user.sex,
    height: user.height || { value: 170, unit: "cm" },
    weight: user.weight || { value: 70, unit: "kg" },
    activityLevel: user.activityLevel,
    goal: user.goal,
    diets: user.diets || [],
    allergens: user.allergens || [],
  })

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
  )

  useEffect(() => {
    const hasChanges =
      JSON.stringify(formData) !==
      JSON.stringify({
        dateOfBirth: user.dateOfBirth,
        sex: user.sex,
        height: user.height || { value: 170, unit: "cm" },
        weight: user.weight || { value: 70, unit: "kg" },
        activityLevel: user.activityLevel,
        goal: user.goal,
        diets: user.diets || [],
        allergens: user.allergens || [],
      })
    setHasUnsavedChanges(hasChanges)
  }, [formData, user])

  const updateFormData = (updates: Partial<User>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleSave = async () => {
    try {
      const finalData = { ...formData }
      if (selectedDate) {
        finalData.dateOfBirth = selectedDate.toISOString().split("T")[0]
      }

      updateUser(finalData)
      setIsEditing(false)
      setHasUnsavedChanges(false)
      toast({
        title: "Profile updated",
        description: "Your health information has been saved successfully.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setFormData({
      dateOfBirth: user.dateOfBirth,
      sex: user.sex,
      height: user.height || { value: 170, unit: "cm" },
      weight: user.weight || { value: 70, unit: "kg" },
      activityLevel: user.activityLevel,
      goal: user.goal,
      diets: user.diets || [],
      allergens: user.allergens || [],
    })
    setSelectedDate(user.dateOfBirth ? new Date(user.dateOfBirth) : undefined)
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }

  return (
    <>
      <UnsavedChangesPrompt hasUnsavedChanges={hasUnsavedChanges} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Health Information</h2>
            <p className="text-muted-foreground">Manage your health data and dietary preferences</p>
          </div>
          {!isEditing && <Button onClick={() => setIsEditing(true)}>Edit</Button>}
        </div>

        <div className="grid gap-6">
          {/* Basic Health Data */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your personal health metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-sm py-2">
                      {user.dateOfBirth ? format(new Date(user.dateOfBirth), "PPP") : "Not set"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Sex</Label>
                  {isEditing ? (
                    <RadioGroup
                      value={formData.sex}
                      onValueChange={(value) => updateFormData({ sex: value as User["sex"] })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Other</Label>
                      </div>
                    </RadioGroup>
                  ) : (
                    <p className="text-sm py-2 capitalize">{user.sex || "Not set"}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Height</Label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.height?.value || ""}
                        onChange={(e) =>
                          updateFormData({
                            height: { ...formData.height!, value: Number(e.target.value) },
                          })
                        }
                        placeholder="170"
                      />
                      <Select
                        value={formData.height?.unit}
                        onValueChange={(value) =>
                          updateFormData({
                            height: { ...formData.height!, unit: value as "cm" | "ft" },
                          })
                        }
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
                  ) : (
                    <p className="text-sm py-2">
                      {user.height ? `${user.height.value} ${user.height.unit}` : "Not set"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Weight</Label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.weight?.value || ""}
                        onChange={(e) =>
                          updateFormData({
                            weight: { ...formData.weight!, value: Number(e.target.value) },
                          })
                        }
                        placeholder="70"
                      />
                      <Select
                        value={formData.weight?.unit}
                        onValueChange={(value) =>
                          updateFormData({
                            weight: { ...formData.weight!, unit: value as "kg" | "lb" },
                          })
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="text-sm py-2">
                      {user.weight ? `${user.weight.value} ${user.weight.unit}` : "Not set"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lifestyle */}
          <Card>
            <CardHeader>
              <CardTitle>Lifestyle & Goals</CardTitle>
              <CardDescription>Your activity level and health goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Activity Level</Label>
                {isEditing ? (
                  <Select
                    value={formData.activityLevel}
                    onValueChange={(value) => updateFormData({ activityLevel: value as User["activityLevel"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                      <SelectItem value="lightly_active">Lightly active (light exercise 1-3 days/week)</SelectItem>
                      <SelectItem value="moderately_active">
                        Moderately active (moderate exercise 3-5 days/week)
                      </SelectItem>
                      <SelectItem value="very_active">Very active (hard exercise 6-7 days/week)</SelectItem>
                      <SelectItem value="extremely_active">
                        Extremely active (very hard exercise, physical job)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm py-2 capitalize">{user.activityLevel?.replace("_", " ") || "Not set"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Goal</Label>
                {isEditing ? (
                  <RadioGroup
                    value={formData.goal}
                    onValueChange={(value) => updateFormData({ goal: value as User["goal"] })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lose_weight" id="lose_weight" />
                      <Label htmlFor="lose_weight">Lose weight</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="maintain_weight" id="maintain_weight" />
                      <Label htmlFor="maintain_weight">Maintain weight</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gain_weight" id="gain_weight" />
                      <Label htmlFor="gain_weight">Gain weight</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="build_muscle" id="build_muscle" />
                      <Label htmlFor="build_muscle">Build muscle</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <p className="text-sm py-2 capitalize">{user.goal?.replace("_", " ") || "Not set"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dietary Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
              <CardDescription>Your dietary restrictions and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Diets</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {DIETS.map((diet) => (
                      <Badge
                        key={diet}
                        variant={formData.diets?.includes(diet) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = formData.diets || []
                          const updated = current.includes(diet)
                            ? current.filter((d) => d !== diet)
                            : [...current, diet]
                          updateFormData({ diets: updated })
                        }}
                      >
                        {diet}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {user.diets && user.diets.length > 0 ? (
                      user.diets.map((diet) => (
                        <Badge key={diet} variant="secondary" className="text-xs">
                          {diet}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground py-2">None specified</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Allergies & Intolerances</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {ALLERGENS.map((allergen) => (
                      <Badge
                        key={allergen}
                        variant={formData.allergens?.includes(allergen) ? "destructive" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = formData.allergens || []
                          const updated = current.includes(allergen)
                            ? current.filter((a) => a !== allergen)
                            : [...current, allergen]
                          updateFormData({ allergens: updated })
                        }}
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {user.allergens && user.allergens.length > 0 ? (
                      user.allergens.map((allergen) => (
                        <Badge key={allergen} variant="destructive" className="text-xs">
                          {allergen}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground py-2">None specified</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isEditing && <StickySaveBar onSave={handleSave} onCancel={handleCancel} hasUnsavedChanges={hasUnsavedChanges} />}
    </>
  )
}
