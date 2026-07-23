'use client';

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useProfile } from "@/hooks/useJobs";
import { RazorpayCheckout } from "@/components/razorpay-checkout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { SITE_CONFIG } from "@/lib/config";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planKey = searchParams?.get('plan') || '1m';
  const { user, isUserLoading } = useUser();
  const { profile, isLoading: isProfileLoading } = useProfile();

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);

  const planMap: Record<string, any> = {
    '1m': SITE_CONFIG.plans.monthly,
    '3m': SITE_CONFIG.plans.quarterly,
    '6m': SITE_CONFIG.plans.halfYearly,
  };

  const selectedPlan = planMap[planKey] || SITE_CONFIG.plans.monthly;

  if (isUserLoading || isProfileLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-primary/20 shadow-2xl overflow-hidden">
        <div className="bg-primary/5 p-6 border-b border-primary/10 flex items-center justify-between">
          <div>
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">Checkout</Badge>
            <h1 className="text-2xl font-bold font-headline">Upgrade to {selectedPlan.name}</h1>
          </div>
          <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-primary/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary fill-current" />
          </div>
        </div>
        
        <CardContent className="pt-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">{selectedPlan.duration} Month Access</span>
              <span className="font-bold">₹{selectedPlan.price}</span>
            </div>
            {selectedPlan.savings && (
                <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Limited Time Discount</span>
                <span className="text-green-600 font-bold">Save {selectedPlan.savings}</span>
                </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="text-muted-foreground italic">Included</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center text-xl font-bold">
              <span>Total Amount</span>
              <span className="text-primary">₹{selectedPlan.price}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account:</span>
              <span className="font-medium truncate max-w-[180px]">{user.email}</span>
            </div>
          </div>

          <RazorpayCheckout 
            userId={user.uid}
            userEmail={user.email || ''}
            userName={profile?.fullName || user.displayName || ''}
            userPhone={profile?.phone || ''}
            amount={selectedPlan.price}
            planId={selectedPlan.id}
            planName={selectedPlan.name}
          />

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Secure payment by Razorpay (UPI, Cards, Netbanking)
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-sm text-muted-foreground mt-8">
        By proceeding, you agree to our <a href="/terms" className="underline underline-offset-4 hover:text-primary">Terms of Service</a> & <a href="/privacy" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-slate-50/30 flex items-center justify-center">
      <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
