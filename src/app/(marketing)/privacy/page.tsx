'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl py-20 px-4 mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold font-headline">Privacy Policy</h1>
      </div>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to Career Pilot AI. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">2. Data We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect and process the following data to provide our intelligent career services:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
            <li><strong>Personal Identity Data:</strong> Full name, email address, and profile picture (if provided via Google).</li>
            <li><strong>Professional Information:</strong> Uploaded resumes, career history, education details, skills, and target role preferences.</li>
            <li><strong>Technical Metadata:</strong> IP address, browser type, and device information to ensure security and improve platform performance.</li>
            <li><strong>Payment Records:</strong> Handled securely via Razorpay. We maintain records of transaction IDs and subscription status, but never store credit/debit card numbers or bank credentials on our servers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">3. Logical Data Processing & AI Disclosure</h2>
          <p className="text-muted-foreground leading-relaxed">
            To deliver personalized insights, CareerPilot AI utilizes advanced computational logic and secure third-party AI-based processing systems.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
            <li><strong>Automated Match Analysis:</strong> Your resume is compared against job descriptions to provide compatibility scoring.</li>
            <li><strong>Secure Transmission:</strong> Data sent for third-party processing is encrypted and transmitted via secure APIs.</li>
            <li><strong>No Data Selling:</strong> We do not sell your professional data to third-party recruiters or data brokers. Your information is used solely for your benefit within the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">4. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures, including 256-bit SSL encryption, to protect your data. However, no method of transmission over the internet is 100% secure. We continuously monitor our systems to prevent unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">5. Governing Law (India)</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Privacy Policy is governed by and construed in accordance with the laws of India. Any disputes arising from these terms are subject to the exclusive jurisdiction of the courts in India.
          </p>
        </section>

        <section className="bg-muted p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Contact Our Privacy Officer</h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions about this privacy policy or wish to exercise your data rights (including data deletion), please contact us:
          </p>
          <div className="space-y-2">
            <p className="font-bold text-primary">{SITE_CONFIG.supportEmail}</p>
            <p className="text-sm text-muted-foreground">Attention: Data Protection Officer</p>
          </div>
        </section>
      </div>
    </div>
  );
}
