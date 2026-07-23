'use client';

import { Gavel } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl py-20 px-4 mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
          <Gavel className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold font-headline">Terms of Service</h1>
      </div>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using Career Pilot AI, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Career Pilot AI provides AI-powered tools for job seekers, including resume analysis, cover letter generation, and interview preparation.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">3. Subscription & Billing</h2>
          <p className="text-muted-foreground leading-relaxed">
            CareerPilot AI offers tiered subscription plans (1, 3, and 6-month durations). 
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
            <li><strong>Pricing:</strong> All prices are listed in INR and are inclusive of applicable taxes unless stated otherwise.</li>
            <li><strong>Payments:</strong> Handled securely via Razorpay. By subscribing, you agree to the billing cycle selected (one-time or recurring).</li>
            <li><strong>Automatic Renewal:</strong> Unless specified otherwise at checkout, subscriptions may automatically renew. You can manage and disable auto-renewal in your dashboard settings at least 24 hours before the cycle ends.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">4. Refund Policy</h2>
          <div className="bg-slate-50 border-l-4 border-primary p-4 text-muted-foreground">
            <p className="font-bold mb-2">Non-Refundable Policy</p>
            Due to the high technical costs associated with secure third-party AI processing and the immediate delivery of personalized digital insights, we generally do NOT offer refunds once a subscription has been activated. You may cancel at any time to prevent future billing.
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">5. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            CareerPilot AI is a guidance tool. While we strive for high accuracy in match scoring and resume optimization, we do not guarantee employment, salary increases, or successful job placements. Our tools provide recommendations based on objective profile analysis, and final career decisions are solely yours.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">6. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These terms are governed by the laws of India. Any litigation or resolution of disputes will take place exclusively in the competent courts within India.
          </p>
        </section>

        <section className="bg-muted p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Legal Inquiries</h2>
          <p className="text-muted-foreground mb-4">
            For billing disputes or legal matters, please reach out directly:
          </p>
          <p className="font-bold text-primary">{SITE_CONFIG.supportEmail}</p>
        </section>
      </div>
    </div>
  );
}
