'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitOnboarding } from '@/actions/onboarding-actions';
import { toast } from 'sonner';
import { CareerScoreRing } from '@/components/career-score-ring';
import { Loader2, ArrowRight, UploadCloud, Target, MapPin, Briefcase, Zap, Brain, Sparkles, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('Building your Career Twin...');
  const [finalData, setFinalData] = useState<any>(null);
  
  const { jobs } = useJobs();

  // Raw Inputs State
  const [resumeText, setResumeText] = useState('');
  const [destinations, setDestinations] = useState(['']);
  const [preferences, setPreferences] = useState({
    currentCTC: '',
    expectedSalary: '',
    workType: '',
    cities: ''
  });
  const [constraints, setConstraints] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  // Check guest handoff data
  useEffect(() => {
    const guestResume = sessionStorage.getItem('guestResume');
    const guestJob = sessionStorage.getItem('guestJob');
    
    let nextStep = 1;
    if (guestResume) {
      setResumeText(guestResume);
      sessionStorage.removeItem('guestResume');
      nextStep = 2; // Skip step 1 if resume is hydrated
    }
    
    if (guestJob) {
      setDestinations([guestJob]);
      sessionStorage.removeItem('guestJob');
      if (nextStep === 2) nextStep = 3; // Auto-skip step 2 if both are hydrated
    }
    
    if (nextStep > 1) {
      setStep(nextStep);
    }
  }, []);

  // Pre-fill destinations from guest handoff jobs
  useEffect(() => {
    if (jobs && jobs.length > 0 && destinations.length === 1 && destinations[0] === '') {
      const titles = jobs.map(j => j.title).filter(Boolean);
      if (titles.length > 0) {
        setDestinations(titles);
        setStep(prev => prev === 2 ? 3 : prev); // Auto-skip step 2 if destination is hydrated
      }
    }
  }, [jobs, destinations]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setStep(4); // Processing Step
    setIsProcessing(true);
    setProcessingText('Analyzing your profile and calculating optimal routes...');

    try {
      const token = await user.getIdToken();
      const payload = {
        rawResumeText: resumeText,
        destinations: destinations.filter(d => d.trim() !== ''),
        preferences,
        constraints,
        goals
      };
      
      const response = await submitOnboarding(token, payload);
      setFinalData(response.twinData);
      setStep(5); // Reveal Step
    } catch (error) {
      toast.error('Failed to generate Career Twin. Please try again.');
      setStep(3); // Go back to last input step
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDestinationChange = (index: number, value: string) => {
    const newDest = [...destinations];
    newDest[index] = value;
    setDestinations(newDest);
  };
  const addDestination = () => setDestinations([...destinations, '']);

  const toggleArrayItem = (arr: string[], setArr: any, item: string) => {
    if (arr.includes(item)) setArr(arr.filter(i => i !== item));
    else setArr([...arr, item]);
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8 absolute inset-0 z-50">
        <div className="relative h-32 w-32 mb-8">
           <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
           <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
           <Brain className="absolute inset-0 m-auto h-12 w-12 text-primary animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold font-headline animate-pulse">{processingText}</h2>
        <p className="text-muted-foreground max-w-md">Our intelligence engine is comparing your profile against thousands of market data points to construct your optimal route.</p>
      </div>
    );
  }

  if (step === 5 && finalData) {
    return (
      <div className="min-h-screen bg-muted/10 flex flex-col items-center justify-center p-6 absolute inset-0 z-50 overflow-y-auto">
        <div className="max-w-2xl w-full space-y-8 animate-in zoom-in-95 duration-1000 py-12">
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 mb-4 px-3 py-1 text-sm"><Sparkles className="w-4 h-4 mr-2 inline" /> Your Career Twin is Ready</Badge>
            <h1 className="text-4xl font-bold font-headline">Welcome to Career Pilot AI</h1>
          </div>

          <Card className="border-primary/20 shadow-2xl bg-card overflow-hidden">
             <CardContent className="p-0">
               <div className="p-10 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-transparent text-center border-b">
                 <CareerScoreRing score={finalData.careerScore} size={180} />
                 <p className="text-lg text-muted-foreground mt-6 max-w-md">{finalData.careerDNA}</p>
               </div>
               
               <div className="p-8 grid grid-cols-2 gap-8 bg-card">
                 <div>
                   <h4 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-3">Top Strengths</h4>
                   <div className="flex flex-wrap gap-2">
                     {finalData.skillGraph.slice(0,4).map((skill: string) => (
                       <Badge key={skill} variant="secondary">{skill}</Badge>
                     ))}
                   </div>
                 </div>
                 <div>
                   <h4 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-3">Radar Matches</h4>
                   <ul className="space-y-2">
                     {finalData.opportunityRadar.slice(0,2).map((match: string) => (
                       <li key={match} className="flex items-center gap-2 text-sm font-medium"><Target className="w-4 h-4 text-primary" /> {match}</li>
                     ))}
                   </ul>
                 </div>
               </div>
               
               <div className="p-8 bg-primary/5 border-t space-y-4">
                 <Button size="lg" className="w-full h-14 text-lg shadow-xl hover:scale-105 transition-transform" onClick={() => router.push('/dashboard')}>
                   Start Improving My Career <ArrowRight className="ml-2 h-5 w-5" />
                 </Button>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col absolute inset-0 z-50">
      {/* Top Progress Bar */}
      <div className="h-2 w-full bg-muted/30">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-6 py-12 md:py-24 animate-in slide-in-from-right-8 duration-500">
        
        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold font-headline">Let's build your Career Twin.</h1>
              <p className="text-lg text-muted-foreground">This takes about 2 minutes. We'll start with your raw data.</p>
            </div>
            <Card className="border-primary/20 shadow-lg">
              <CardContent className="p-6 md:p-8 space-y-6">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-primary" /> Paste Your Resume (Recommended)
                </Label>
                <Textarea 
                  placeholder="Paste your entire resume text here. Our AI will automatically extract your roles, skills, and metrics..." 
                  className="min-h-[300px] resize-none text-base p-4"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                <Button size="lg" onClick={handleNext} disabled={!resumeText.trim()} className="w-full h-14 text-lg">
                  Next Step <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-headline">Where do you want to go?</h1>
              <p className="text-lg text-muted-foreground">List a few target job titles or domains.</p>
            </div>
            <div className="space-y-4">
              {destinations.map((dest, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Senior Software Engineer" 
                    className="h-14 text-lg"
                    value={dest}
                    onChange={(e) => handleDestinationChange(i, e.target.value)}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addDestination} className="mt-2">
                + Add another destination
              </Button>
            </div>
            <div className="flex gap-4 pt-8">
              <Button variant="ghost" size="lg" onClick={handleBack} className="w-full md:w-auto h-14">Back</Button>
              <Button size="lg" onClick={handleNext} className="w-full h-14 text-lg flex-1" disabled={!destinations[0].trim()}>
                Next <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold font-headline">Career DNA</h1>
              <p className="text-lg text-muted-foreground">Just a few final details to calculate your trajectory.</p>
            </div>
            
            <div className="space-y-8 bg-card border border-primary/10 rounded-2xl p-6 md:p-8 shadow-sm">
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Current CTC (e.g. 12 LPA)" className="h-12" value={preferences.currentCTC} onChange={(e) => setPreferences({...preferences, currentCTC: e.target.value})} />
                  <Input placeholder="Expected Salary (e.g. 18 LPA)" className="h-12" value={preferences.expectedSalary} onChange={(e) => setPreferences({...preferences, expectedSalary: e.target.value})} />
                  <Input placeholder="Work Setup (Remote, Hybrid, Office)" className="h-12" value={preferences.workType} onChange={(e) => setPreferences({...preferences, workType: e.target.value})} />
                  <Input placeholder="Target Cities (e.g. Bangalore)" className="h-12" value={preferences.cities} onChange={(e) => setPreferences({...preferences, cities: e.target.value})} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Constraints</h3>
                <div className="flex flex-wrap gap-2">
                  {['Can relocate', 'No relocation', 'Only remote', 'Immediate joining', 'Notice period > 60 days', 'Career break', 'Part-time', 'Visa sponsorship needed'].map((c) => {
                    const isSelected = constraints.includes(c);
                    return (
                      <Badge 
                        key={c} 
                        variant={isSelected ? "default" : "outline"} 
                        className={`cursor-pointer px-4 py-2 text-sm border-primary/20 ${isSelected ? 'shadow-md scale-105' : 'hover:bg-muted'} transition-all`}
                        onClick={() => toggleArrayItem(constraints, setConstraints, c)}
                      >
                        {c}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Primary Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {['Higher salary', 'Faster growth', 'Better work-life balance', 'International opportunities', 'Leadership', 'Career switch', 'Stability', 'Startup experience'].map((g) => {
                    const isSelected = goals.includes(g);
                    return (
                      <Badge 
                        key={g} 
                        variant={isSelected ? "default" : "outline"} 
                        className={`cursor-pointer px-4 py-2 text-sm border-primary/20 ${isSelected ? 'shadow-md scale-105' : 'hover:bg-muted'} transition-all`}
                        onClick={() => toggleArrayItem(goals, setGoals, g)}
                      >
                        {g}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" size="lg" onClick={handleBack} className="w-full md:w-auto h-14">Back</Button>
              <Button size="lg" onClick={handleSubmit} disabled={isProcessing} className="w-full h-14 text-lg flex-1 bg-primary text-primary-foreground shadow-xl hover:scale-105 transition-transform">
                <Brain className="w-5 h-5 mr-2" /> Generate Career Twin
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
