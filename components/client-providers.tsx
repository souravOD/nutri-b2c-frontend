// components/client-providers.tsx
"use client"

import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { ThemeProvider } from "@/components/theme-provider"
import RouteGuard from "@/components/route-guard"
import { Toaster } from "@/components/ui/toaster"

import { UserProvider } from "@/hooks/use-user"
import { FiltersProvider } from "@/hooks/use-filters"
import { FavoritesProvider } from "@/hooks/use-favorites"
import { HistoryProvider } from "@/hooks/use-history"
import { SettingsProvider } from "@/hooks/use-settings"

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  )
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <FavoritesProvider>
            <HistoryProvider>
              <FiltersProvider>
                <SettingsProvider>
                  <RouteGuard>{children}</RouteGuard>
                  <Toaster />
                </SettingsProvider>
              </FiltersProvider>
            </HistoryProvider>
          </FavoritesProvider>
        </UserProvider>
        {isDevelopment ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
