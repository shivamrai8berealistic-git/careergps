"use client";

import dynamic from "next/dynamic";
import { Rocket } from "lucide-react";

// Dynamically import AuthGate + AppShell with SSR disabled.
// This ensures the protected layout is NEVER server-rendered,
// eliminating the "flash of authenticated content" when
// unauthenticated users visit protected URLs directly.
const AuthGate = dynamic(
  () => import("@/components/auth-gate").then((mod) => mod.AuthGate),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen flex-col items-center justify-center bg-background space-y-4">
        <Rocket className="h-10 w-10 text-primary animate-bounce" />
        <p className="text-muted-foreground animate-pulse text-sm">
          Loading CareerPilot...
        </p>
      </div>
    ),
  }
);

const AppShell = dynamic(
  () => import("@/components/app-shell").then((mod) => mod.AppShell),
  { ssr: false }
);

const OnboardingGate = dynamic(
  () => import("@/components/onboarding-gate").then((mod) => mod.OnboardingGate),
  { ssr: false }
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <OnboardingGate>
        <AppShell>{children}</AppShell>
      </OnboardingGate>
    </AuthGate>
  );
}
