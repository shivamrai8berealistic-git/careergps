"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Rocket } from "lucide-react";

/**
 * AuthGate wraps all protected (app) routes.
 * 
 * It prevents ANY content from rendering until Firebase Auth
 * has resolved the user's authentication state. This eliminates
 * the "flash of authenticated content" that occurs when
 * unauthenticated users visit protected URLs directly.
 * 
 * Flow:
 * 1. isUserLoading=true  → Show loading spinner
 * 2. isUserLoading=false, user=null  → Redirect to /login
 * 3. isUserLoading=false, user exists → Render children
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  // Auth state still loading — show a branded full-screen loader
  if (isUserLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background space-y-4">
        <Rocket className="h-10 w-10 text-primary animate-bounce" />
        <p className="text-muted-foreground animate-pulse text-sm">
          Loading CareerPilot...
        </p>
      </div>
    );
  }

  // Auth resolved but no user — show redirect message (useEffect handles redirect)
  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background space-y-4">
        <Rocket className="h-10 w-10 text-primary animate-bounce" />
        <p className="text-muted-foreground animate-pulse text-sm">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // User is authenticated — render the protected content
  return <>{children}</>;
}
