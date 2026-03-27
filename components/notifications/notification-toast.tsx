"use client";

import { ToastAction } from "@/components/ui/toast";

/**
 * PRD-32: Toast action button for notification pop-ups.
 * Navigates to the notification's action_url when tapped.
 * Styled in Nutri Green (#99CC33) to match the app theme.
 *
 * NOTE: This is called as a plain function (not JSX) from the Toaster's
 * CustomEvent handler, so it MUST NOT use React hooks (useRouter, etc).
 * We use window.location for navigation instead.
 */
export function NotificationToastAction({ url }: { url: string }) {
    return (
        <ToastAction
            altText="View notification"
            onClick={() => {
                if (url.startsWith("/")) {
                    window.location.href = url;
                } else {
                    window.open(url, "_blank");
                }
            }}
            style={{
                backgroundColor: "#99CC33",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "12px",
                padding: "6px 14px",
            }}
        >
            View →
        </ToastAction>
    );
}
