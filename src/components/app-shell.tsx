"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Briefcase,
  FileText,
  Home,
  KanbanSquare,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Rocket,
  Settings,
  UploadCloud,
  User,
  Wand2,
  Zap,
  Radar,
  ShieldCheck,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuickCaptureDialog } from "@/components/QuickCaptureDialog";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useUserUsage } from "@/hooks/useJobs";


const navGroups = [
  {
    label: "Navigation Engine",
    items: [
      { href: "/dashboard", icon: <Home />, label: "Dashboard" },
      { href: "/jobs", icon: <KanbanSquare />, label: "Job Tracker" },
      { href: "/radar", icon: <Radar />, label: "Radar" },
    ]
  },
  {
    label: "Career Assets",
    items: [
      { href: "/resume-builder", icon: <FileText />, label: "Resume Builder" },
      { href: "/cover-letters", icon: <Wand2 />, label: "Cover Letters" },
      { href: "/proof-builder", icon: <Briefcase />, label: "Proof Builder" },
      { href: "/resumes", icon: <UploadCloud />, label: "Resume Uploads" },
    ]
  },
  {
    label: "Intelligence",
    items: [
      { href: "/assistant", icon: <Rocket />, label: "AI Assistant" },
      { href: "/interviews", icon: <MessageSquare />, label: "Interview Prep" },
      { href: "/proof", icon: <ShieldCheck />, label: "Employer Proof" },
    ]
  }
];

const bottomNavItems = [
  { href: "/settings", icon: <Settings />, label: "Settings" },
  { href: "/help", icon: <LifeBuoy />, label: "Help & Support" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { plan } = useUserUsage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Broadcast Auth Token to Chrome Extension
  useEffect(() => {
    async function syncExtension() {
      if (user) {
        try {
          const token = await user.getIdToken();
          window.postMessage({ type: 'CP_AUTH_TOKEN', token: token }, window.location.origin);
        } catch (e) {
          // ignore
        }
      }
    }
    syncExtension();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // Derive user initials for the avatar fallback
  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Rocket className="size-7 text-primary" />
            <span className="text-xl font-bold font-headline text-primary-foreground">
              CareerPilot
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[10px] tracking-widest uppercase font-bold text-muted-foreground/70 mb-1">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href}>
                        <SidebarMenuButton
                          isActive={pathname === item.href}
                          tooltip={{ children: item.label }}
                          className={cn(
                             "transition-all duration-200 relative",
                             pathname === item.href && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-primary before:rounded-r-full shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                          )}
                        >
                          {item.icon}
                          <span className={pathname === item.href ? "font-semibold" : ""}>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-border/50 p-4">
          <SidebarMenu>
            {bottomNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
               <Avatar className="h-9 w-9 border-2 border-primary/20 bg-background shadow-sm">
                 <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                 <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">{initials}</AvatarFallback>
               </Avatar>
               <div className="flex flex-col overflow-hidden">
                 <span className="text-sm font-semibold truncate leading-tight">{user?.displayName || "Career Explorer"}</span>
                 <span className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-bold">{plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</span>
               </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
               <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />

          <div className="w-full flex-1" />

          {/* Quick Add - accessible from any page */}
          <QuickCaptureDialog
            trigger={
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-1.5 hidden sm:flex bg-primary hover:bg-primary/90"
                id="header-quick-add"
              >
                <Zap className="h-3.5 w-3.5" />
                Quick Add
              </Button>
            }
          />

          <Button variant="outline" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Toggle notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.displayName || "My Account"}</span>
                  {user.email && (
                    <span className="text-xs text-muted-foreground font-normal truncate max-w-[200px]">
                      {user.email}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => {
                e.preventDefault();
                handleLogout();
              }}>
                <LogOut className="mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
