'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { SITE_CONFIG } from '@/lib/config';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const firestore = useFirestore();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await addDoc(collection(firestore, 'site_submissions'), {
        ...formData,
        userId: user?.uid || 'anonymous',
        type: 'contact',
        status: 'new',
        createdAt: serverTimestamp()
      });
      
      setIsSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (err: any) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container max-w-2xl py-32 px-4 mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-bold font-headline">Thank you!</h1>
        <p className="text-xl text-muted-foreground">
          We've received your message and our team will get back to you within 24-48 hours.
        </p>
        <Button size="lg" onClick={() => setIsSubmitted(false)}>Send another message</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-20 px-4 mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Contact Our Team</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Have questions about the platform or need support with your job search? We're here to help.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-1 space-y-8">
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Mail className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Email Us</h3>
                        <p className="text-muted-foreground">{SITE_CONFIG.supportEmail}</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Community</h3>
                        <p className="text-muted-foreground">Join our Discord community for quick help.</p>
                        <a href={SITE_CONFIG.socials.discord} className="text-primary text-sm font-medium hover:underline">Join Discord</a>
                    </div>
                </div>
            </div>

            <Card className="bg-primary/5 border-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg">Response Time</CardTitle>
                    <CardDescription>We typically respond within 1 business day for all support requests.</CardDescription>
                </CardHeader>
            </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline">Send a Message</CardTitle>
              <CardDescription>Fill out the form below and we'll get right back to you.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                            id="name" 
                            placeholder="John Doe" 
                            required 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            disabled={isLoading}
                            className="focus-visible:ring-2 focus-visible:ring-primary/50 transition-all bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="john@example.com" 
                            required 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            disabled={isLoading}
                            className="focus-visible:ring-2 focus-visible:ring-primary/50 transition-all bg-background/50"
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                        id="subject" 
                        placeholder="How can we help?" 
                        required 
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        disabled={isLoading}
                        className="focus-visible:ring-2 focus-visible:ring-primary/50 transition-all bg-background/50"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                        id="message" 
                        placeholder="Tell us more about your inquiry..." 
                        className="min-h-[150px] focus-visible:ring-2 focus-visible:ring-primary/50 transition-all bg-background/50"
                        required 
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        disabled={isLoading}
                    />
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-semibold hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Message"}
                    <Send className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
