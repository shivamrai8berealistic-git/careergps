'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { initiateProSubscription } from "@/actions/payments";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useUser } from "@/firebase";

interface RazorpayCheckoutProps {
  userId: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  planId: string;
  amount: number;
  planName: string;
}
 
export function RazorpayCheckout({ 
  userId, 
  userEmail, 
  userPhone, 
  userName,
  planId,
  amount,
  planName
}: RazorpayCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();
 
  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken();
      const response = await initiateProSubscription(idToken, planId);
      
      if (!response.success) {
        throw new Error(response.error);
      }
 
      const options = {
        key: response.keyId,
        subscription_id: response.subscriptionId,
        name: "Career Pilot AI",
        description: `${planName} PRO Subscription`,
        image: "/logo.png",
        handler: function (response: any) {
          toast.success("Payment successful! Syncing your credits...");
          setTimeout(() => {
            router.push("/dashboard?status=success");
          }, 2000);
        },
        prefill: {
          name: userName || "",
          email: userEmail || "",
          contact: userPhone || ""
        },
        theme: {
          color: "#4f46e5" 
        }
      };
 
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      
      rzp.on('payment.failed', function (response: any) {
        toast.error("Payment failed: " + response.error.description);
      });
 
    } catch (error: any) {
      console.error("Checkout failed:", error);
      toast.error(error.message || "Subscription failed to initialize.");
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Button 
        onClick={handlePayment} 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-all font-bold h-12"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4 fill-current" />
            Pay ₹{amount} Now
          </>
        )}
      </Button>
    </>
  );
}
