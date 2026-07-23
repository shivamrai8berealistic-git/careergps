'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lock, ArrowRight, Loader2, ChevronRight, Star } from 'lucide-react';

export default function PublicInterviewPracticePage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  const handleGenerate = async () => {
    if (!role.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/public-tools/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      setQuestions(data.questions || ['Tell me about yourself.', 'Why do you want this role?', 'What is your biggest strength?']);
    } catch (e) {
      setQuestions(['Tell me about yourself.', 'Why do you want this role?', 'Describe a challenging project.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAnswer = async (q: string) => {
    if (!answer.trim()) return;
    setIsFeedbackLoading(true);
    try {
      const res = await fetch('/api/public-tools/interview-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, answer }),
      });
      const data = await res.json();
      setFeedback(data.feedback || 'Good start. Sign up for detailed AI coaching feedback.');
    } catch (e) {
      setFeedback('Good answer structure. Sign up to receive detailed coaching.');
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">

        <header className="text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30 text-xs font-bold uppercase tracking-widest">Free Practice</Badge>
          <h1 className="text-4xl font-bold font-headline tracking-tight">AI Interview Practice</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Practice real interview questions for your target role. Get instant AI feedback on your answers.
          </p>
        </header>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Your Target Role</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend Engineer, Product Manager, Data Scientist..." />
          </div>
          <Button onClick={handleGenerate} disabled={isLoading || !role.trim()} className="w-full font-bold text-base py-6">
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <MessageSquare className="w-5 h-5 mr-2" />}
            Generate Practice Questions
          </Button>
        </div>

        {questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Practice Questions for: <span className="text-primary">{role}</span></h2>
            {questions.slice(0, 3).map((q, i) => (
              <Card key={i} className={`border-border/60 cursor-pointer hover:border-primary/40 transition-colors ${activeQ === i ? 'border-primary/40' : ''}`} onClick={() => { setActiveQ(i); setFeedback(null); setAnswer(''); }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-sm font-medium leading-relaxed">{q}</p>
                  </div>
                  {activeQ === i && (
                    <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer here..." className="min-h-[100px] resize-none" />
                      <Button size="sm" onClick={() => handleCheckAnswer(q)} disabled={isFeedbackLoading || !answer.trim()}>
                        {isFeedbackLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
                        Get Feedback
                      </Button>
                      {feedback && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm font-medium">
                          {feedback}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Soft gate */}
            <Card className="border-dashed border-2 bg-transparent text-center py-8">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-base mb-1">Unlock Full AI Mock Interview</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">Get 20+ role-specific questions, voice practice, STAR method coaching, and a complete readiness score saved to your Career Twin.</p>
              <Button className="font-bold group" onClick={() => {
                sessionStorage.setItem('guestContext', JSON.stringify({ toolUsed: 'interview', targetRole: role }));
                router.push('/signup');
              }}>
                Start Full Interview Practice <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
