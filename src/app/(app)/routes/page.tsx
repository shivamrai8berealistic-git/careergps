'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Navigation2, Zap, Trophy, TrendingUp, Compass, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { generateRoute } from '@/actions/route-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const ROUTE_OPTIONS = [
  {
    style: 'fastest',
    title: 'Fastest Route',
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    description: 'Minimum time to Target Position. Skips optional depth for speed.',
    benefits: ['Tight timeline', 'Upcoming interview', 'Direct path'],
    color: 'amber'
  },
  {
    style: 'highest_success',
    title: 'Highest Success Route',
    icon: <Trophy className="w-6 h-6 text-green-500" />,
    description: 'Maximizes match probability with thorough preparation.',
    benefits: ['Maximum confidence', 'Deep mastery', 'Reduces risk'],
    color: 'green'
  },
  {
    style: 'highest_salary',
    title: 'Highest Salary Route',
    icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
    description: 'Optimizes for negotiation leverage and premium skills.',
    benefits: ['Salary bump', 'Leadership signaling', 'System design'],
    color: 'blue'
  },
  {
    style: 'lowest_effort',
    title: 'Lowest Effort Route',
    icon: <Compass className="w-6 h-6 text-purple-500" />,
    description: 'Leverages existing skills aggressively. Minimal new learning.',
    benefits: ['Already strong match', 'Quick pivot', 'Low stress'],
    color: 'purple'
  }
];

export default function RouteShowcasePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // In a real app, you would select the blueprint and job dynamically
  const DUMMY_BLUEPRINT_ID = 'frontend-engineer-react';
  const DUMMY_TARGET_ROLE = 'Senior Frontend Engineer';

  const handleSelectRoute = async (style: string) => {
    if (!user) return;
    setIsGenerating(true);
    setSelectedStyle(style);
    
    try {
      const token = await user.getIdToken();
      const res = await generateRoute(token, DUMMY_BLUEPRINT_ID, style as any, DUMMY_TARGET_ROLE);
      if (res.success) {
        toast.success(`Route generation started!`);
        router.push(`/routes/generating/${res.jobId}`);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Insufficient credits')) {
        toast.error('Not enough credits to generate a route. Please upgrade to continue.');
        router.push('/pricing');
      } else {
        toast.error('Failed to generate route: ' + e.message);
      }
      setIsGenerating(false);
      setSelectedStyle(null);
    }
  };

  if (isUserLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">
      
      <header className="flex flex-col gap-4 text-center items-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
          <Navigation2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-4xl font-bold font-headline tracking-tight">
          Select Your Career Route
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
          Your Career GPS has analyzed your Career Twin against the target role: <strong className="text-foreground">{DUMMY_TARGET_ROLE}</strong>. Select an optimization strategy to proceed.
        </p>
      </header>

      <div className="mt-12">
        {/* Default: Fastest Route */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> Recommended Route
          </h3>
          <Card className="border-amber-500/30 shadow-lg bg-amber-500/5 hover:border-amber-500/60 transition-all group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-background rounded-xl border border-amber-500/20 shadow-sm">
                    {ROUTE_OPTIONS[0].icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold font-headline">{ROUTE_OPTIONS[0].title}</CardTitle>
                    <CardDescription className="text-base mt-1 text-foreground/80">{ROUTE_OPTIONS[0].description}</CardDescription>
                  </div>
                </div>
                <Badge className="bg-amber-500 text-white hover:bg-amber-600">Default</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                {ROUTE_OPTIONS[0].benefits.map(b => (
                  <Badge variant="outline" key={b} className="bg-background">{b}</Badge>
                ))}
              </div>
              <Button 
                size="lg" 
                className="w-full sm:w-auto font-bold bg-amber-500 hover:bg-amber-600 text-white"
                disabled={isGenerating}
                onClick={() => handleSelectRoute(ROUTE_OPTIONS[0].style)}
              >
                {isGenerating && selectedStyle === ROUTE_OPTIONS[0].style ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                Navigate Fastest Route
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Alternatives Toggle */}
        {!showAlternatives ? (
          <div className="text-center">
             <Button variant="ghost" onClick={() => setShowAlternatives(true)} className="text-muted-foreground hover:text-foreground group">
                See Alternative Routes <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
             </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-500">
            <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Alternative Routes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ROUTE_OPTIONS.slice(1).map((option) => (
                <Card key={option.style} className="border-border/50 hover:border-primary/50 transition-all flex flex-col group">
                  <CardHeader>
                    <div className="p-3 bg-muted rounded-xl w-12 h-12 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      {option.icon}
                    </div>
                    <CardTitle className="text-xl font-bold font-headline">{option.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm h-10">{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-1">
                      {option.benefits.map(b => (
                        <span key={b} className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-muted px-2 py-1 rounded">
                          {b}
                        </span>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 group-hover:border-primary/50"
                      disabled={isGenerating}
                      onClick={() => handleSelectRoute(option.style)}
                    >
                      {isGenerating && selectedStyle === option.style ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Select {option.title.split(' ')[0]}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="ghost" onClick={() => setShowAlternatives(false)} className="text-muted-foreground">
                 Hide Alternatives
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
