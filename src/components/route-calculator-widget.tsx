"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MapPin, User, Navigation, ArrowRight, Link as LinkIcon, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

export function RouteCalculatorWidget() {
  const router = useRouter();
  const [pointA, setPointA] = useState("");
  const [pointB, setPointB] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointA || !pointB) return;
    
    setIsCalculating(true);
    
    // Simulate calculation animation before handing off to signup
    setTimeout(() => {
      // In a real flow, you'd pass these params to /signup or save them in localStorage
      sessionStorage.setItem("guestResume", pointA);
      sessionStorage.setItem("guestJob", pointB);
      router.push("/signup?intent=calculate_route");
    }, 1500);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-primary/20 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />
      
      <CardHeader className="relative z-10 text-center pb-4">
         <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Route Calculator
         </CardTitle>
         <CardDescription>
            Plot your fastest career trajectory instantly.
         </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10">
        <form onSubmit={handleCalculate} className="space-y-6">
          <div className="space-y-3">
             <div className="flex items-center justify-between text-sm font-semibold text-foreground/80 uppercase tracking-wider">
               <span className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Point A (Current State)</span>
               <button type="button" onClick={() => {
                 setPointA("Software Engineer with 4 years of experience building React/Node.js applications. Strong in TypeScript, AWS, and system design.");
                 setPointB("Staff Engineer");
               }} className="text-[10px] text-primary/70 hover:text-primary lowercase bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-full transition-colors font-medium">Use demo profile</button>
             </div>
             <div className="relative">
               <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                 placeholder="Paste your LinkedIn URL or Resume Text..." 
                 value={pointA}
                 onChange={(e) => setPointA(e.target.value)}
                 className="bg-background/80 border-primary/10 h-12 focus-visible:ring-primary/50 pl-9"
                 required
               />
             </div>
          </div>

          <div className="relative pl-6">
             {/* Connecting Line */}
             <div className="absolute left-[9px] -top-6 bottom-4 w-0.5 bg-gradient-to-b from-border to-primary border-dashed opacity-50" />
             <div className="absolute left-[4px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary/40" />
          </div>

          <div className="space-y-3">
             <label htmlFor="pointB" className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wider">
               <MapPin className="w-4 h-4 text-primary" /> 
               Point B (Target Destination)
             </label>
             <div className="relative">
               <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/70" />
               <Input 
                 placeholder="Paste Target Job URL or Job Title..." 
                 value={pointB}
                 id="pointB"
                 onChange={(e) => setPointB(e.target.value)}
                 className="bg-background/80 border-primary/10 h-12 focus-visible:ring-primary/50 pl-9"
                 required
               />
             </div>
          </div>

          <Button 
             type="submit" 
             className="w-full h-12 text-md font-bold mt-4 shadow-lg bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
             disabled={isCalculating || !pointA || !pointB}
          >
             {isCalculating ? (
               <>
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                 Calculating Route...
               </>
             ) : (
               <>
                 Calculate Route <ArrowRight className="ml-2 h-5 w-5" />
               </>
             )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
