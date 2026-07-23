'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, Trash2, UploadCloud, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useResumes } from "@/hooks/useJobs";
import { useStorage, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { parseResume } from "@/ai/flows/parse-resume";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ResumesPage() {
  const router = useRouter();
  const { user } = useUser();
  const storage = useStorage();
  const { resumes, isLoading, addResume, deleteResume, setPrimaryResume, saveParsedData } = useResumes();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !storage) return;

    // Validate file type
    if (file.type !== "application/pdf" && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Uploading to storage...");
    
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `users/${user.uid}/resumes/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      setUploadProgress("Analyzing your professional profile...");
      
      // 2. Parse with AI
      // Convert to base64 for Genkit flow
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const dataUri = await base64Promise;

      const parsedData = await parseResume({ 
        userId: user.uid,
        resumeDataUri: dataUri 
      });

      setUploadProgress("Saving information...");
      
      // 3. Save to Firestore
      const resumeDoc = await addResume(file.name, storageRef.fullPath);
      await saveParsedData(resumeDoc.id, parsedData);

      toast.success("Resume uploaded and parsed successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      if (error.message?.includes("QUOTA_EXCEEDED")) {
        toast.error(error.message.replace("QUOTA_EXCEEDED: ", ""), {
          action: {
            label: "Upgrade",
            onClick: () => router.push("/pricing")
          }
        });
      } else {
        toast.error("Failed to upload resume. Please try again.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      // Reset input
      e.target.value = "";
    }
  };

  const handleDelete = async (resumeId: string, storagePath: string) => {
    try {
      await deleteResume(resumeId);
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      toast.success("Resume deleted.");
    } catch (error) {
      toast.error("Failed to delete resume.");
    }
  };

  const handleSetPrimary = async (resumeId: string) => {
    try {
      await setPrimaryResume(resumeId);
      toast.success("Primary resume updated.");
    } catch (error) {
      toast.error("Failed to update primary resume.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Resume Management</h1>
          <p className="text-muted-foreground italic text-sm mb-1 text-primary/80">
            Your data is processed securely using industry-leading systems to generate personalized insights. We never sell your data.
          </p>
          <p className="text-muted-foreground">Upload and manage your resumes for smart career analysis.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/resume-builder"><Sparkles className="mr-2 h-4 w-4" /> Create from Scratch</a>
          </Button>
          <div className="relative">
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button asChild disabled={isUploading}>
              <label htmlFor="resume-upload" className="cursor-pointer">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isUploading ? "Uploading..." : "Upload Resume"}
              </label>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Resumes</CardTitle>
          <CardDescription>You can set one resume as primary for default analysis.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {resumes && resumes.length > 0 ? (
            resumes.map(resume => (
              <Card key={resume.id} className={`flex items-center justify-between p-4 transition-all ${resume.isPrimary ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${resume.isPrimary ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-semibold">{resume.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {resume.createdAt?.toDate ? format(resume.createdAt.toDate(), 'PPP') : 'Recently'}
                    </p>
                  </div>
                   {resume.isPrimary && (
                     <Badge variant="default" className="ml-2 bg-primary hover:bg-primary">
                       <CheckCircle2 className="w-3 h-3 mr-1" /> Primary
                     </Badge>
                   )}
                </div>
                <div className="flex items-center gap-2">
                  {!resume.isPrimary && (
                    <Button variant="outline" size="sm" onClick={() => handleSetPrimary(resume.id)}>
                      Set as Primary
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(resume.id, resume.storagePath)} aria-label="Delete resume">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/20">
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No resumes yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                Upload your first resume to start getting smart job insights and content recommendations.
              </p>
              <Button asChild disabled={isUploading}>
                <label htmlFor="resume-upload" className="cursor-pointer">
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Select File
                </label>
              </Button>
            </div>
          )}
          
          {isUploading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-card p-8 rounded-xl shadow-2xl border flex flex-col items-center gap-6 max-w-sm w-full animate-in zoom-in duration-300">
                <div className="relative">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-purple-500 animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">Optimizing Your Data</h3>
                  <p className="text-muted-foreground mt-2">{uploadProgress}</p>
                </div>
                <Progress value={uploadProgress.includes('Saving') ? 90 : uploadProgress.includes('Parsing') ? 60 : 30} className="w-full h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
