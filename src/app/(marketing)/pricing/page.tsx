'use client';

import { Check, Sparkles, Zap, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUserUsage } from "@/hooks/useJobs";
import { QUOTA_LIMITS } from "@/lib/quota-limits";
import { useState } from "react";

export default function PricingPage() {
  const { plan } = useUserUsage();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Free",
      price: "₹0",
      description: "Ideal for exploring the platform and basic tracking.",
      features: [
        `${QUOTA_LIMITS.free.jobAnalyses} Job Match Analyses / mo`,
        "Basic Profile Parsing",
        "Application History Tracking",
        "Community Support",
      ],
      buttonText: plan === 'free' ? "Current Plan" : "Get Started",
      buttonVariant: "outline" as const,
      highlight: false,
    },
    {
      name: "1 Month Pro",
      price: isAnnual ? "₹239" : "₹299",
      period: "/ month",
      description: "Standard access for immediate job search needs.",
      features: [
        `${QUOTA_LIMITS.pro.jobAnalyses} Job Match Analyses / mo`,
        "Professional Cover Letter Generator",
        "Intelligent Interview Preparation",
        "Priority Assistant Access",
      ],
      buttonText: "Upgrade Standard",
      buttonVariant: "outline" as const,
      highlight: false,
      duration: 1,
    },
    {
      name: "3 Month Pro",
      price: isAnnual ? "₹639" : "₹799",
      period: isAnnual ? "total (₹213/mo)" : "total (₹266/mo)",
      description: "The most effective choice for thorough interview preparation.",
      features: [
        "Everything in 1 Month Pro",
        "Save 11% vs monthly billing",
        "Advanced Profile Optimization insights",
        "Exclusive 'Best Fit' Strategy Guides",
      ],
      buttonText: "Get Best Match",
      buttonVariant: "default" as const,
      highlight: true,
      badge: "Most Popular",
      duration: 3,
    },
    {
      name: "6 Month Pro",
      price: isAnnual ? "₹1,199" : "₹1,499",
      period: isAnnual ? "total (₹199/mo)" : "total (₹249/mo)",
      description: "Best for final year students and long-term career planning.",
      features: [
        "Everything in 3 Month Pro",
        "Save 16% vs monthly billing",
        "Early access to new features",
        "Premium support response time",
      ],
      buttonText: "Go Elite",
      buttonVariant: "outline" as const,
      highlight: false,
      badge: "Best Value",
      duration: 6,
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 px-4">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-6 mb-12">
        <Badge variant="secondary" className="px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
          Professional Career Support
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight max-w-3xl">
          Choose the right plan for your career goals
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl">
          Transparent pricing for serious job seekers. No hidden fees. Cancel anytime.
        </p>
      </div>

      <div className="flex justify-center items-center mb-12 space-x-4 cursor-pointer" onClick={() => setIsAnnual(!isAnnual)}>
         <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>Monthly billing</span>
         <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? 'bg-primary' : 'bg-primary/20'}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-background transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
         </div>
         <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>
           Annual billing 
           <span className="text-[10px] text-green-700 bg-green-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Save 20%</span>
         </span>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((p, idx) => (
          <Card 
            key={p.name} 
            className={`flex flex-col border-none shadow-lg transition-all duration-300 hover:shadow-xl relative ${
              p.highlight ? 'ring-2 ring-primary glass scale-[1.05] z-10' : 'glass'
            }`}
          >
            {p.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                {p.badge}
              </div>
            )}
            
            <CardHeader className="pt-8 pb-4 text-center">
              <CardTitle className="text-xl font-bold">
                {p.name}
              </CardTitle>
              <div className="mt-2 flex flex-col items-center">
                <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                <span className="text-xs text-muted-foreground mt-1 capitalize">{p.period || "Free Forever"}</span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 px-6 pt-2">
              <p className="text-sm text-center text-muted-foreground mb-6 h-10">
                {p.description}
              </p>
              <ul className="space-y-3">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${p.highlight ? 'text-primary' : 'text-slate-400'}`} />
                    <span className="text-xs text-slate-600 leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-6 pb-8 px-6">
              <Button 
                className="w-full h-11 text-sm font-semibold rounded-lg"
                variant={p.buttonVariant}
                asChild
              >
                {!p.name.includes('Pro') ? (
                  <Link href={plan === 'free' ? '/dashboard' : '/signup'}>
                    {p.buttonText}
                  </Link>
                ) : plan !== 'pro' ? (
                  <Link href={`/checkout?plan=${p.duration}m${isAnnual ? '&annual=true' : ''}`}>
                    {p.buttonText}
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    Current Plan
                  </Link>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-20 max-w-3xl mx-auto space-y-8">
        <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
                <Shield className="w-8 h-8 mx-auto text-primary" />
                <h4 className="font-bold text-sm">Secure Payment</h4>
                <p className="text-xs text-muted-foreground">Processed by Razorpay</p>
            </div>
            <div className="space-y-2">
                <Zap className="w-8 h-8 mx-auto text-primary" />
                <h4 className="font-bold text-sm">Instant Access</h4>
                <p className="text-xs text-muted-foreground">Features unlock immediately</p>
            </div>
            <div className="space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-primary" />
                <h4 className="font-bold text-sm">Smart Auto-Renew</h4>
                <p className="text-xs text-muted-foreground">Manage easily in settings</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
            All plans include access to our intelligent matching logic. Subscriptions automatically renew at the end of each billing cycle unless cancelled. Prices are in Indian Rupees (INR).
        </p>
      </div>
    </div>
  );
}
