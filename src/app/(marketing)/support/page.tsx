'use client';

import { HelpCircle, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SupportPage() {
  const contactOptions = [
    {
      icon: <Mail className="h-6 w-6 text-primary" />,
      title: "Email Support",
      description: "Typical response time: 24-48 hours",
      action: "support@careerpilotai.com",
      link: "mailto:support@careerpilotai.com"
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      title: "Community Discord",
      description: "Get quick help from other job seekers and our team.",
      action: "Join Discord",
      link: "#"
    }
  ];

  const faqs = [
    {
      q: "How do I upgrade to Pro?",
      a: "Click on 'Go Pro' in your dashboard or visit our Pricing page. We accept UPI, Cards, and Netbanking via Razorpay."
    },
    {
      q: "Can I cancel my subscription?",
      a: "Yes, you can cancel any time from your settings. Your Pro benefits will continue until the end of the billing period."
    },
    {
      q: "Is my resume data secure?",
      a: "Yes. We use industry-standard encryption and only process data using secure third-party AI systems for the sole purpose of providing personalized career insights. Your data is never sold."
    }
  ];

  return (
    <div className="container max-w-4xl py-20 px-4 mx-auto">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-2">
          <HelpCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline">How can we help?</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We're here to help you navigate your job search and make the most of Career Pilot AI.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-20">
        {contactOptions.map((option, idx) => (
          <Card key={idx} className="border-primary/10 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <div className="mb-4 p-2 w-fit bg-slate-50 rounded-lg">
                {option.icon}
              </div>
              <CardTitle className="text-xl font-headline">{option.title}</CardTitle>
              <CardDescription className="text-base">{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
               <Button className="w-full group" variant="outline" asChild>
                  <a href={option.link}>
                    {option.action}
                    <ExternalLink className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
               </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 md:p-12">
        <h2 className="text-3xl font-bold font-headline mb-8 text-center">Frequently Asked Questions</h2>
        <div className="grid gap-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">{faq.q}</h3>
              <p className="text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
