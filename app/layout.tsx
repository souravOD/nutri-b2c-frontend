// app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"

import ClientProviders from "@/components/client-providers"
import { AppShell } from "@/components/app-shell"
import { ErrorBoundary } from "@/components/error-boundary"
import { ChatWidget } from "@/components/chat/chat-widget"
import { FeedbackFAB } from "@/components/feedback/feedback-fab"
import { FabStackProvider } from "@/contexts/fab-stack-context"

export const metadata: Metadata = {
  title: "Nutri B2C",
  description: "Nutrition application",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <ClientProviders>
            <FabStackProvider>
              <AppShell>
                <div className="min-h-[100dvh] bg-background text-foreground">{children}</div>
              </AppShell>
              <FeedbackFAB />
              <ChatWidget />
            </FabStackProvider>
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}
