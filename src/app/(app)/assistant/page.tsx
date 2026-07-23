'use client';

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Rocket, Send, Loader2, Sparkles, User, Bot } from "lucide-react";
import { useJobs, useProfile, useResumes } from "@/hooks/useJobs";
import { useUser } from "@/firebase";
import { chatCareerAssistant } from "@/ai/flows/chat-career-assistant";
import { toast } from "sonner";

export default function AssistantPage() {
  const { jobs } = useJobs();
  const { profile } = useProfile();
  const { resumes, getParsedResume, getPrimaryResume } = useResumes();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "Welcome to your Career Copilot. I can help with strategy, resume polish, or interview prep based on your profile." }
  ]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    const { user } = useUser();
    try {
      const primaryResume = getPrimaryResume();
      let parsedResumeData = null;
      if (primaryResume) {
        parsedResumeData = await getParsedResume(primaryResume.id);
      }

      const response = await chatCareerAssistant({
        userId: user?.uid || '',
        userQuestion: userMessage,
        userProfile: profile || {},
        userResume: parsedResumeData || {},
        savedJobsContext: jobs?.slice(0, 5) || [], // Send top 5 recent jobs for context
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("Chat failed:", error);
      toast.error("I'm having trouble connecting right now. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Smart Career Assistant</h1>
          <p className="text-muted-foreground">Intelligent career assistance for your job search strategies.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 border-primary/20 shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b py-4">
           <CardTitle className="flex items-center gap-2 text-primary">
             <Sparkles className="h-5 w-5 fill-primary" /> 
             Career Intelligence
           </CardTitle>
           <CardDescription>Ask about your resume, market fit, or specific saved jobs.</CardDescription>
        </CardHeader>
        
        <CardContent 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
            {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-purple-600/10 text-purple-600'
                    }`}>
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    
                    <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed shadow-sm transition-all animate-in slide-in-from-bottom-2 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-muted rounded-tl-none'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {isSending && (
              <div className="flex items-start gap-3">
                 <div className="h-8 w-8 rounded-full bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                 </div>
                 <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                 </div>
              </div>
            )}
        </CardContent>

        <div className="p-4 bg-background border-t">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 max-w-4xl mx-auto w-full"
          >
            <div className="relative flex-1">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about your career strategy..." 
                className="pr-12 py-6 rounded-full border-primary/20 focus-visible:ring-primary shadow-inner"
                disabled={isSending}
              />
              <Button 
                type="submit"
                size="icon" 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 transition-transform active:scale-95 shadow-md"
                disabled={isSending || !input.trim()}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
