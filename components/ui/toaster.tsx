"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { NotificationToastAction } from "@/components/notifications/notification-toast"
import type { NotificationToastPayload } from "@/hooks/use-realtime-notifications"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, toast } = useToast()

  // PRD-32: Listen for "notification-toast" CustomEvents from the Realtime hook.
  // We bridge via CustomEvent because Next.js webpack can create separate module
  // instances for use-toast.ts across chunks. By calling toast() HERE (same chunk
  // as the Toaster), we guarantee it dispatches to the same memoryState/listeners.
  useEffect(() => {
    function handleNotificationToast(e: Event) {
      const detail = (e as CustomEvent<NotificationToastPayload>).detail
      if (!detail?.title) return
      console.log("[Toaster] Received notification-toast event:", detail.title)
      toast({
        title: `${detail.icon || "📌"} ${detail.title}`,
        description: detail.body || undefined,
        action: detail.actionUrl
          ? NotificationToastAction({ url: detail.actionUrl })
          : undefined,
      })
    }
    window.addEventListener("notification-toast", handleNotificationToast)
    return () => window.removeEventListener("notification-toast", handleNotificationToast)
  }, [toast])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            {/* ─── Desktop: green accent header bar ─── */}
            <div
              className="hidden sm:block h-[4px] w-full rounded-t-2xl"
              style={{ background: "linear-gradient(90deg, #99CC33 0%, #7AB82A 100%)" }}
            />

            {/* ─── Content area ─── */}
            <div className="flex items-start gap-3 sm:p-5 sm:pr-10">
              {/* Icon circle (desktop only) */}
              <div
                className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: "rgba(153, 204, 51, 0.12)" }}
              >
                🔔
              </div>

              {/* Text content */}
              <div className="grid gap-1 min-w-0 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>

              {/* Action button — desktop */}
              <div className="hidden sm:flex items-center shrink-0">
                {action}
              </div>
            </div>

            {/* Action button — mobile (keeps original inline position) */}
            <div className="sm:hidden">
              {action}
            </div>

            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
