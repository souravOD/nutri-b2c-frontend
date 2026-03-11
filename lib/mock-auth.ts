export interface User {
  id: string
  name: string
  email: string
  image?: string
  // Health data
  dateOfBirth?: string
  sex?: "male" | "female" | "other"
  height?: { value: number; unit: "cm" | "ft" }
  weight?: { value: number; unit: "kg" | "lb" }
  activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active"
  goal?: "lose_weight" | "maintain_weight" | "gain_weight" | "build_muscle"
  diets?: string[]
  allergens?: string[]
  intolerances?: string[]
  dislikedIngredients?: string[]
}

export interface AuthState {
  isAuthed: boolean
  user: User | null
  profileCompletePct: number
  testingBypass: boolean
}

const STORAGE_KEY = "nutri-auth-state"

const DEMO_USER: User = {
  id: "demo-user",
  name: "Demo User",
  email: "demo@example.com",
  dateOfBirth: "1990-01-01",
  sex: "other",
  height: { value: 170, unit: "cm" },
  weight: { value: 70, unit: "kg" },
  activityLevel: "moderately_active",
  goal: "maintain_weight",
  diets: ["vegetarian"],
  allergens: [],
  intolerances: [],
  dislikedIngredients: [],
}

function calculateProfileCompleteness(user: User | null): number {
  if (!user) return 0

  const requiredFields = ["dateOfBirth", "sex", "height", "weight", "activityLevel"]
  const completedFields = requiredFields.filter((field) => {
    const value = user[field as keyof User]
    return value !== undefined && value !== null
  })

  return Math.round((completedFields.length / requiredFields.length) * 100)
}

export class MockAuth {
  private state: AuthState

  constructor() {
    this.state = this.loadState()
  }

  private loadState(): AuthState {
    if (typeof window === "undefined") {
      return { isAuthed: false, user: null, profileCompletePct: 0, testingBypass: false }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...parsed,
          profileCompletePct: calculateProfileCompleteness(parsed.user),
        }
      }
    } catch (error) {
      console.warn("Failed to load auth state:", error)
    }

    return { isAuthed: false, user: null, profileCompletePct: 0, testingBypass: false }
  }

  private saveState() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (error) {
      console.warn("Failed to save auth state:", error)
    }
  }

  getState(): AuthState {
    return { ...this.state }
  }

  async login(email: string, _password: string): Promise<{ success: boolean; user?: User }> {
    void _password
    // Mock login - always succeeds
    const user: User = {
      id: `user-${Date.now()}`,
      name: email.split("@")[0],
      email,
    }

    this.state = {
      isAuthed: true,
      user,
      profileCompletePct: calculateProfileCompleteness(user),
      testingBypass: this.state.testingBypass,
    }

    this.saveState()
    return { success: true, user }
  }

  async register(name: string, email: string, _password: string): Promise<{ success: boolean; user?: User }> {
    void _password
    // Mock register - always succeeds
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      email,
    }

    this.state = {
      isAuthed: true,
      user,
      profileCompletePct: calculateProfileCompleteness(user),
      testingBypass: this.state.testingBypass,
    }

    this.saveState()
    return { success: true, user }
  }

  signInAsDemo(): void {
    this.state = {
      isAuthed: true,
      user: { ...DEMO_USER },
      profileCompletePct: calculateProfileCompleteness(DEMO_USER),
      testingBypass: this.state.testingBypass,
    }
    this.saveState()
  }

  enableTestingBypass(): void {
    this.state.testingBypass = true
    this.saveState()
  }

  resetDemoState(): void {
    this.state = { isAuthed: false, user: null, profileCompletePct: 0, testingBypass: false }
    this.saveState()
  }

  signOut(): void {
    this.state = {
      isAuthed: false,
      user: null,
      profileCompletePct: 0,
      testingBypass: this.state.testingBypass,
    }
    this.saveState()
  }

  updateUser(updates: Partial<User>): void {
    if (!this.state.user) return

    this.state.user = { ...this.state.user, ...updates }
    this.state.profileCompletePct = calculateProfileCompleteness(this.state.user)
    this.saveState()
  }

  needsHealthOnboarding(): boolean {
    if (this.state.testingBypass) return false
    if (!this.state.user) return false

    const requiredFields = ["dateOfBirth", "sex", "height", "weight", "activityLevel"]
    return requiredFields.some((field) => {
      const value = this.state.user![field as keyof User]
      return value === undefined || value === null
    })
  }
}

export const mockAuth = new MockAuth()
