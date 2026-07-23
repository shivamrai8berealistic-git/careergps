import {
  ArrowRight,
  BarChart3,
  FileText,
  Globe,
  KanbanSquare,
  MessageSquare,
  Wand2,
  Users,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { RouteCalculatorWidget } from "@/components/route-calculator-widget";

const features = [
  {
    slug: "career-twin",
    icon: <BarChart3 className="w-8 h-8 text-primary" />,
    title: "Career Twin",
    description: "We build a digital replica of your skills, DNA, and momentum to establish exactly where you are today (Point A).",
  },
  {
    slug: "navigation-engine",
    icon: <Globe className="w-8 h-8 text-primary" />,
    title: "Navigation Engine",
    description: "Identify your target destination (Point B) and let the GPS calculate the exact route to get there.",
  },
  {
    slug: "mission-engine",
    icon: <KanbanSquare className="w-8 h-8 text-primary" />,
    title: "Mission Engine",
    description: "Your long-term goals broken down into highly actionable daily missions to maintain your momentum.",
  },
  {
    slug: "proof-engine",
    icon: <FileText className="w-8 h-8 text-primary" />,
    title: "Proof Builder",
    description: "Automatically generate public proof of your skills to eliminate employer doubt.",
  },
  {
    slug: "route-optimization",
    icon: <Wand2 className="w-8 h-8 text-primary" />,
    title: "Line X Route Optimization",
    description: "Recalculate your career trajectory in real-time based on new skills acquired and market changes.",
  },
  {
    slug: "career-memory",
    icon: <MessageSquare className="w-8 h-8 text-primary" />,
    title: "Career Memory",
    description: "Every action, application, and skill improvement is logged to build a historical map of your career.",
  },
];

const heroImage = PlaceHolderImages.find((img) => img.id === "hero-image");

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Decorative background orbs */}
            <div className="absolute top-10 left-1/4 w-80 h-80 bg-primary/30 rounded-full blur-3xl -z-10 animate-pulse mix-blend-multiply" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-500/25 rounded-full blur-3xl -z-10 animate-pulse mix-blend-multiply" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col justify-center space-y-6 items-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline text-balance">
                Google Maps for Your Career
              </h1>
              <p className="max-w-[600px] text-foreground/60 font-medium md:text-xl">
                Know exactly where you are, where you want to go, and the fastest route to get there. The world's first AI Career GPS.
              </p>
              <RouteCalculatorWidget />
              
              {/* Social Proof */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <div className="flex -space-x-2 hover:space-x-1 transition-all duration-300">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/40 to-violet-500/40 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-sm">
                       <Users className="w-3 h-3 text-primary-foreground/80" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                   <div className="flex gap-0.5">
                     {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                   </div>
                   <span className="font-semibold text-foreground">4.9/5</span> — Trusted by <span className="font-semibold text-foreground">2,400+</span> professionals
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-24 md:py-32 bg-slate-50 dark:bg-card">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Key Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                The Career Navigation Platform
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We've moved beyond tracking applications. We optimize your entire career trajectory.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-10 lg:max-w-none lg:grid-cols-3 pt-12">
            {features.map((feature, i) => (
              <Card 
                key={feature.title} 
                className={`flex flex-col h-full bg-background/50 backdrop-blur-sm border-primary/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group rounded-2xl overflow-hidden ${i === 1 ? 'ring-1 ring-primary/30 scale-[1.02]' : ''}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="mb-4 p-3 rounded-xl bg-primary/10 w-fit group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-md transition-all duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="pt-2 font-headline text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4">
                  <p className="text-muted-foreground flex-1">{feature.description}</p>
                  <div className="pt-2">
                    <Link href={`/features/${feature.slug}`} className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:gap-2.5 transition-all duration-200">
                        Learn more <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section className="w-full py-20 md:py-32 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container grid items-center justify-center gap-6 px-4 text-center md:px-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
              Ready to navigate your career?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground font-medium md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Stop guessing. Let the Career GPS calculate your fastest route to your dream role.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
             <Link href="/signup">
                <Button size="lg" className="w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 shadow-lg text-lg font-semibold h-14">
                  Start Your Free Route <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
