'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Save, FileText, Check, Copy, History } from "lucide-react";
import { useJobs, useCoverLetters, useProfile, useResumes } from "@/hooks/useJobs";
import { useUser } from "@/firebase";
import { generateCoverLetter } from "@/ai/flows/generate-cover-letter";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function CoverLettersPage() {
  const router = useRouter();
  const { jobs } = useJobs();
  const { profile } = useProfile();
  const { resumes, getParsedResume, getPrimaryResume } = useResumes();
  const { coverLetters, saveCoverLetter } = useCoverLetters();

  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");

  const handleGenerate = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job first.");
      return;
    }
    if (!profile) {
      toast.error("Please complete your profile first.");
      return;
    }

    const job = jobs?.find(j => j.id === selectedJobId);
    const resume = getPrimaryResume();
    
    if (!job || !resume) {
      toast.error("Job or primary resume data missing.");
      return;
    }

    const { user } = useUser();
    setIsGenerating(true);
    try {
      const parsedResume = await getParsedResume(resume.id);
      
      const result = await generateCoverLetter({
        userId: user?.uid || '',
        jobId: selectedJobId,
        userProfile: {
          name: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          headline: profile.headline || "",
          yearsOfExperience: Number(profile.yearsOfExperience) || 0,
          keySkills: profile.keySkills || [],
          preferredRoles: profile.preferredRoles || [],
        },
        resumeSummary: parsedResume?.summary || "Highly motivated professional.",
        jobJSON: {
          title: job.title,
          company: job.company,
          location: job.location || "",
          responsibilities: (job as any).responsibilities || [],
          requiredSkills: (job as any).requiredSkills || [],
        },
        tone: selectedTone as any,
      });

      setGeneratedResult(result);
      await saveCoverLetter({
        jobId: selectedJobId,
        jobTitle: job.title,
        jobCompany: job.company,
        tone: selectedTone,
        text: result.coverLetterText,
        conciseText: result.conciseVariant,
      });
      toast.success("Cover letter generated and saved!");
    } catch (error: any) {
      console.error("Generation failed:", error);
      if (error.message?.includes("QUOTA_EXCEEDED")) {
        toast.error(error.message.replace("QUOTA_EXCEEDED: ", ""), {
          action: {
            label: "Upgrade",
            onClick: () => router.push("/pricing")
          }
        });
      } else {
        toast.error("Failed to generate cover letter.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Cover Letter Generator</h1>
          <p className="text-muted-foreground">Tailor your pitch for every application in seconds.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="generator">
            <Wand2 className="w-4 h-4 mr-2" /> Generator
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Select a target job and desired style.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="job-select">Target Application</Label>
                  <Select onValueChange={setSelectedJobId} value={selectedJobId}>
                    <SelectTrigger id="job-select">
                      <SelectValue placeholder="Choose a saved job..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs?.map(job => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} - {job.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="tone-select">Choose Tone</Label>
                  <Select value={selectedTone} onValueChange={setSelectedTone}>
                    <SelectTrigger id="tone-select">
                      <SelectValue placeholder="Select a tone..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Balanced</SelectItem>
                      <SelectItem value="confident">Confident & Bold</SelectItem>
                      <SelectItem value="concise">Concise & Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedJobId}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Crafting Letter...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate AI Match
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 flex flex-col h-[500px] border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>AI-Crafted Pitch</CardTitle>
                  <CardDescription>Generated based on your profile & job requirements.</CardDescription>
                </div>
                {generatedResult && (
                   <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedResult.coverLetterText)}>
                     {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                   </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-0 px-6 pb-6 overflow-hidden">
                 <div className="h-full rounded-md border bg-background/50 p-4 font-serif text-sm overflow-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                   {isGenerating ? (
                     <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Analyzing job fit and drafting...</p>
                     </div>
                   ) : generatedResult ? (
                     generatedResult.coverLetterText
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-center">
                        <FileText className="h-10 w-10 opacity-20 mb-2" />
                        <p>Your tailored letter will appear here.</p>
                     </div>
                   )}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="grid gap-4">
             {coverLetters && coverLetters.length > 0 ? (
               coverLetters.map((cl: any) => (
                 <Card key={cl.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => { setGeneratedResult({ coverLetterText: cl.text }); setActiveTab("generator"); }}>
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <FileText className="h-5 w-5" />
                         </div>
                         <div>
                            <CardTitle className="text-base">{cl.jobTitle} @ {cl.jobCompany}</CardTitle>
                            <CardDescription>
                              {cl.tone} variant • {cl.createdAt?.toDate ? format(cl.createdAt.toDate(), 'PPP p') : 'Recently'}
                            </CardDescription>
                         </div>
                       </div>
                       <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); copyToClipboard(cl.text); }}>
                          <Copy className="h-4 w-4 mr-2" /> Copy
                       </Button>
                    </CardHeader>
                 </Card>
               ))
             ) : (
               <div className="text-center py-20 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No previously generated letters.</p>
               </div>
             )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
