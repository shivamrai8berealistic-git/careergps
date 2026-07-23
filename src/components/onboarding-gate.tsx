"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useProfile } from "@/hooks/useJobs";
import { Rocket } from "lucide-react";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile) {
      if (!profile.isOnboarded && !pathname.includes("/onboarding")) {
        router.replace("/onboarding");
      }
    }
  }, [profile, isLoading, pathname, router]);

  // While checking profile status, show a loader
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background space-y-4">
        <Rocket className="h-10 w-10 text-primary animate-bounce" />
        <p className="text-muted-foreground animate-pulse text-sm">
          Loading your Career Twin...
        </p>
      </div>
    );
  }

  // If they aren't onboarded, but they are trying to access a protected route (other than onboarding)
  // don't render the children (the dashboard, etc).
  if (profile && !profile.isOnboarded && !pathname.includes("/onboarding")) {
    return null; // The useEffect above will redirect them
  }

  return <>{children}</>;
}
