// app/admin/page.tsx  (Dashboard)
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { loadFixture } from "@/lib/admin/fixtures"
import { Users, FileText, Package, Activity } from "lucide-react"

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalRecipes: number
    totalProducts: number
    searchQueries: number
    conversionRate: number
  }
  trends: {
    weeklyActiveUsers: number[]
    weeklySearches: number[]
    weeklyRecipeViews: number[]
  }
  top: {
    searches: { query: string; count: number }[]
    recipes: { id: string; title: string; views: number }[]
  }
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const analytics = await loadFixture("analytics")
      setData(analytics as AnalyticsData)
      setIsLoading(false)
    }
    loadData()
  }, [])

  if (isLoading || !data) {
    return <div className="p-4 text-muted-foreground">Loading dashboard…</div>
  }

  const { overview, trends, top } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your NutriFind platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{overview.totalUsers.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Active: {overview.activeUsers.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recipes</CardDescription>
            <CardTitle className="text-3xl">{overview.totalRecipes.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {overview.searchQueries.toLocaleString()} searches
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Products</CardDescription>
            <CardTitle className="text-3xl">{overview.totalProducts.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              Conversion {overview.conversionRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Engagement</CardDescription>
            <CardTitle className="text-3xl">{Math.max(...trends.weeklyActiveUsers)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Peak weekly active users
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Searches</CardTitle>
          <CardDescription>Most common user queries this week</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {top.searches.map((s) => (
            <div key={s.query} className="flex items-center justify-between border rounded-md p-3">
              <span>{s.query}</span>
              <Badge variant="secondary">{s.count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
