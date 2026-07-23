'use client';

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserPlan, PRO_MONTHLY_CREDITS, INITIAL_FREE_CREDITS } from "@/lib/quota-limits";
import { Sparkles, Zap, Coins, ArrowRight } from "lucide-react";
import Link from 'next/link';

interface UsageMeterProps {
  usage: any;
  plan: UserPlan;
}

export function UsageMeter({ usage, plan }: UsageMeterProps) {
  const creditsRemaining = usage?.creditsRemaining ?? (plan === 'pro' ? PRO_MONTHLY_CREDITS : INITIAL_FREE_CREDITS);
  const maxCredits = plan === 'pro' ? PRO_MONTHLY_CREDITS : Math.max(INITIAL_FREE_CREDITS, creditsRemaining);
  const percentage = Math.min((creditsRemaining / maxCredits) * 100, 100);

  return (
    <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4">
        {plan === 'pro' ? (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 border-none">
            <Zap className="w-3 h-3 mr-1 fill-current" /> Premium Plan
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-muted text-muted-foreground border-none">
            Free Plan
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          Credit Balance
          {plan === 'free' && <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Coins className="w-6 h-6" />
            {creditsRemaining} <span className="text-sm font-normal text-muted-foreground">Credits</span>
          </div>
          <Progress 
            value={percentage} 
            className={`h-2 ${percentage < 20 ? 'bg-destructive/20' : ''}`}
            // Progress color logic can be improved later if needed
          />
        </div>
        
        {plan === 'free' ? (
          <div className="pt-2 border-t border-primary/10">
            <p className="text-xs text-muted-foreground italic mb-2">
              Upgrade to Premium for unlimited access and advanced automation features.
            </p>
            <Link href="/credits" className="text-xs text-primary font-medium flex items-center hover:underline">
              View transaction history <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="pt-2 border-t border-primary/10">
            <Link href="/credits" className="text-xs text-primary font-medium flex items-center hover:underline">
              View transaction history <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
