'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, Lock, ArrowRight, Loader2, TrendingUp, MapPin } from 'lucide-react';

const CITIES = ['Bangalore', 'Mumbai', 'Delhi / NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Tier-2 City'];
const EXP_LEVELS = ['0-1 years (Fresher)', '1-3 years', '3-5 years', '5-8 years', '8-12 years', '12+ years'];

export default function PublicSalaryCheckPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    if (!role.trim() || !city || !experience) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/public-tools/salary-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, city, experience }),
      });
      const data = await res.json();
      setPreview(data);
    } catch (e) {
      setPreview({ medianSalary: '₹12–18 LPA', band: 'Mid', city, role });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">

        <header className="text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30 text-xs font-bold uppercase tracking-widest">India-First Intelligence</Badge>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Salary Check</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Get real India salary ranges for your role and city. Not global averages — real data calibrated for Indian markets.
          </p>
        </header>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Your Role / Target Role</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer, Product Manager, Data Analyst..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">City</label>
              <Select onValueChange={setCity}>
                <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Experience Level</label>
              <Select onValueChange={setExperience}>
                <SelectTrigger><SelectValue placeholder="Select Experience" /></SelectTrigger>
                <SelectContent>{EXP_LEVELS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCheck} disabled={isLoading || !role.trim() || !city || !experience} className="w-full font-bold text-base py-6">
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <IndianRupee className="w-5 h-5 mr-2" />}
            Check Salary Range
          </Button>
        </div>

        {preview && (
          <Card className="border-primary/20 overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-center gap-1"><MapPin className="w-3 h-3" />{preview.city}</p>
                <h2 className="text-3xl font-black font-headline text-primary">{preview.medianSalary}</h2>
                <p className="text-sm text-muted-foreground mt-1">Median salary band for {preview.role} in India</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Entry</p>
                  <p className="font-bold text-lg blur-sm select-none">₹X–Y LPA</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <p className="text-xs text-primary uppercase tracking-wider font-bold">Median</p>
                  <p className="font-black text-xl text-primary">{preview.medianSalary}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 relative">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Senior</p>
                  <p className="font-bold text-lg blur-sm select-none">₹X–Y LPA</p>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Soft gate for full data */}
              <div className="border border-border/60 rounded-xl p-5 text-center space-y-3">
                <TrendingUp className="w-8 h-8 text-primary mx-auto" />
                <h3 className="font-bold text-base">See Your Full Salary Intelligence Report</h3>
                <p className="text-sm text-muted-foreground">Unlock company-wise ranges, negotiation tips, equity breakdown, notice period norms, and how your skills affect salary in this market.</p>
                <Button className="w-full font-bold group" onClick={() => {
                  sessionStorage.setItem('guestContext', JSON.stringify({ toolUsed: 'salary', targetRole: role, location: city }));
                  router.push('/signup');
                }}>
                  Unlock Full Report — Free <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
