'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Wand2, Loader2, CheckCircle, BrainCircuit, Users, Terminal, Info, History } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useJobs, useInterviewPreps, useProfile } from "@/hooks/useJobs";
import { useUser } from "@/firebase";
import { prepareForInterview } from "@/ai/flows/prepare-for-interview";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function InterviewPrepPage() {
  const { jobs } = useJobs();
  const { profile } = useProfile();
  const { user } = useUser();
  const { interviewPreps, saveInterviewPrep } = useInterviewPreps();

  const [selectedJobId, setSelectedJobId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrep, setGeneratedPrep] = useState<any>(null);
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
    if (!job) return;

    setIsGenerating(true);
    try {
      const result = await prepareForInterview({
        userId: user?.uid || '',
        jobId: selectedJobId,
        jobJson: {
          title: job.title,
          company: job.company,
          location: job.location || "",
          responsibilities: job.description || "",
          requiredSkills: [],
        },
        userProfile: {
          fullName: profile.fullName,
          yearsOfExperience: profile.yearsOfExperience,
          keySkills: profile.keySkills,
          preferredRoles: profile.preferredRoles,
          currentOrLastJobTitle: profile.headline,
        }
      });

      setGeneratedPrep(result);
      await saveInterviewPrep({
        jobId: selectedJobId,
        jobTitle: job.title,
        jobCompany: job.company,
        ...result,
      });
      toast.success("Interview prep generated and saved!");
    } catch (error) {
      console.error("Prep generation failed:", error);
      toast.error("Failed to generate interview prep.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Interview Preparation</h1>
        <p className="text-muted-foreground">AI-driven coaching tailored to your profile and the specific role.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="generator">
            <BrainCircuit className="w-4 h-4 mr-2" /> Generator
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-4">
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Prep Setup</CardTitle>
                <CardDescription>Select a job to start generating materials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="job-select">Target Role</Label>
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
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-indigo-600"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedJobId}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Get Interview Prep
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <BrainCircuit className="h-5 w-5 text-primary" />
                   Interview Playbook
                </CardTitle>
                <CardDescription>Likely questions and strategic guidance.</CardDescription>
              </CardHeader>
              <CardContent>
                {!generatedPrep && !isGenerating ? (
                   <div className="py-20 text-center flex flex-col items-center gap-4 text-muted-foreground">
                      <Users className="h-12 w-12 opacity-10" />
                      <p>Select a job and run the generator to see your tailored playbook.</p>
                   </div>
                ) : isGenerating ? (
                   <div className="py-20 text-center flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p>Deep-diving into job requirements...</p>
                   </div>
                ) : (
                  <Accordion type="multiple" defaultValue={["behavioral"]} className="w-full">
                    <AccordionItem value="behavioral" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline bg-muted/30 px-4 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span>Behavioral Questions</span>
                          <Badge variant="outline" className="ml-2">{generatedPrep.behavioralQuestions.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-muted/10 px-6 pt-4 pb-2 border-x rounded-b-lg">
                        <ul className="space-y-4">
                          {generatedPrep.behavioralQuestions.map((q: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm">
                               <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                               <p className="leading-relaxed">{q}</p>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="technical" className="border-b-0 mt-4">
                      <AccordionTrigger className="hover:no-underline bg-muted/30 px-4 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-blue-500" />
                          <span>Technical & Skills</span>
                          <Badge variant="outline" className="ml-2">{generatedPrep.technicalQuestions.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-muted/10 px-6 pt-4 pb-2 border-x rounded-b-lg">
                        <ul className="space-y-4">
                          {generatedPrep.technicalQuestions.map((q: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm">
                               <span className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                               <p className="leading-relaxed">{q}</p>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="role-fit" className="border-b-0 mt-4">
                      <AccordionTrigger className="hover:no-underline bg-muted/30 px-4 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Role-Fit & Culture</span>
                          <Badge variant="outline" className="ml-2">{generatedPrep.roleFitQuestions.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-muted/10 px-6 pt-4 pb-2 border-x rounded-b-lg">
                        <ul className="space-y-4">
                          {generatedPrep.roleFitQuestions.map((q: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm">
                               <span className="h-5 w-5 rounded-full bg-green-500/10 text-green-500 text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                               <p className="leading-relaxed">{q}</p>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="guidance" className="border-b-0 mt-4">
                      <AccordionTrigger className="hover:no-underline bg-primary/10 px-4 rounded-t-lg text-primary">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          <span>Strategy & Guidance</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-primary/5 px-6 pt-4 pb-4 border-x border-primary/20 rounded-b-lg">
                        <ul className="space-y-3">
                          {generatedPrep.answerGuidance.map((tip: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs italic text-muted-foreground">
                               <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                               <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="grid gap-4">
             {interviewPreps && interviewPreps.length > 0 ? (
               interviewPreps.map((prep: any) => (
                 <Card key={prep.id} className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => { setGeneratedPrep(prep); setActiveTab("generator"); }}>
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500">
                            <BrainCircuit className="h-5 w-5" />
                         </div>
                         <div>
                            <CardTitle className="text-base">{prep.jobTitle} @ {prep.jobCompany}</CardTitle>
                            <CardDescription>
                              {prep.createdAt?.toDate ? format(prep.createdAt.toDate(), 'PPP p') : 'Recently'}
                            </CardDescription>
                         </div>
                       </div>
                       <Button variant="outline" size="sm">View Playbook</Button>
                    </CardHeader>
                 </Card>
               ))
             ) : (
               <div className="text-center py-20 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No previously generated interview materials.</p>
               </div>
             )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
