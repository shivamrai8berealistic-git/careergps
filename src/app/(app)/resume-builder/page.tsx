'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  FileText, Plus, Trash2, Save, Loader2, Printer, ChevronDown, ChevronUp, GripVertical, Sparkles, Briefcase, ArrowLeft
} from 'lucide-react';
import {
  getMasterResume, saveMasterResume, getResumeVersions, deleteResumeVersion, generateResumeVersionAction,
  MasterResume, ResumeExperience, ResumeEducation, ResumeProject, ResumeVersion
} from '@/actions/resume-builder-actions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useJobs, useProfile } from '@/hooks/useJobs';
import { EmptyState } from '@/components/ui/empty-state';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function ResumeBuilderPage() {
  const { user, isUserLoading } = useUser();
  const { profile } = useProfile();
  const { jobs } = useJobs();
  const router = useRouter();
  const [resume, setResume] = useState<MasterResume | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contact: true, summary: true, experience: true, education: true, skills: true, projects: true,
  });

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const [resumeRes, versionsRes] = await Promise.all([
          getMasterResume(token),
          getResumeVersions(token),
        ]);
        if (resumeRes.success && resumeRes.resume) setResume(resumeRes.resume);
        if (versionsRes.success) setVersions(versionsRes.versions);
      } catch (e) {
        console.error('Failed to load resume data', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user || !resume) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      await saveMasterResume(token, resume);
      toast.success('Resume saved and Career Twin updated.');
    } catch (e) {
      toast.error('Failed to save resume.');
    } finally {
      setIsSaving(false);
    }
  }, [user, resume]);

  const handleDeleteVersion = async (versionId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await deleteResumeVersion(token, versionId);
      setVersions(v => v.filter(ver => ver.id !== versionId));
      toast.success('Version deleted.');
    } catch (e) {
      toast.error('Failed to delete version.');
    }
  };

  const handleGenerate = async (jobId: string) => {
    if (!user) return;
    setIsGenerating(prev => ({ ...prev, [jobId]: true }));
    try {
      const token = await user.getIdToken();
      const res = await generateResumeVersionAction(token, jobId);
      if (res.success) {
        setVersions(prev => [res.version as ResumeVersion, ...prev]);
        toast.success('Resume version generated successfully!');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate resume version.');
    } finally {
      setIsGenerating(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = (field: keyof MasterResume, value: any) => {
    setResume(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // ── Experience Helpers ──
  const addExperience = () => {
    if (!resume) return;
    const entry: ResumeExperience = {
      id: generateId(), title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, bullets: [''],
    };
    updateField('experience', [...resume.experience, entry]);
  };

  const updateExperience = (id: string, field: string, value: any) => {
    if (!resume) return;
    updateField('experience', resume.experience.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeExperience = (id: string) => {
    if (!resume) return;
    updateField('experience', resume.experience.filter(e => e.id !== id));
  };

  // ── Education Helpers ──
  const addEducation = () => {
    if (!resume) return;
    const entry: ResumeEducation = { id: generateId(), degree: '', institution: '', fieldOfStudy: '', graduationDate: '' };
    updateField('education', [...resume.education, entry]);
  };

  const updateEducation = (id: string, field: string, value: any) => {
    if (!resume) return;
    updateField('education', resume.education.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEducation = (id: string) => {
    if (!resume) return;
    updateField('education', resume.education.filter(e => e.id !== id));
  };

  // ── Project Helpers ──
  const addProject = () => {
    if (!resume) return;
    const entry: ResumeProject = { id: generateId(), name: '', description: '', url: '', techStack: [] };
    updateField('projects', [...resume.projects, entry]);
  };

  const updateProject = (id: string, field: string, value: any) => {
    if (!resume) return;
    updateField('projects', resume.projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProject = (id: string) => {
    if (!resume) return;
    updateField('projects', resume.projects.filter(p => p.id !== id));
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading Resume Builder...</p>
      </div>
    );
  }

  if (!resume) return null;

  const SectionHeader = ({ title, sectionKey, count }: { title: string; sectionKey: string; count?: number }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full text-left py-3 px-1 group"
    >
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold font-headline">{title}</h3>
        {count !== undefined && <Badge variant="secondary" className="text-xs">{count}</Badge>}
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-6 animate-in fade-in duration-500">
      
      <Button variant="ghost" className="text-muted-foreground -ml-4" onClick={() => router.push(`/dashboard`)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mt-2">
        <div>
          <h2 className="text-3xl font-bold font-headline">Resume Builder</h2>
          <p className="text-muted-foreground mt-1">Create and manage your master resume. Generate job-specific versions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print / PDF
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Resume
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Editor */}
        <div className="lg:col-span-2 space-y-4 print:col-span-3">

          {/* Contact */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader title="Contact Information" sectionKey="contact" />
              {expandedSections.contact && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Full Name</label>
                    <Input value={resume.fullName} onChange={e => updateField('fullName', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Professional Headline</label>
                    <Input value={resume.headline} onChange={e => updateField('headline', e.target.value)} placeholder="e.g. Full Stack Developer" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Email</label>
                    <Input value={resume.email} onChange={e => updateField('email', e.target.value)} type="email" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Phone</label>
                    <Input value={resume.phone || ''} onChange={e => updateField('phone', e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-sm font-semibold">Location</label>
                    <Input value={resume.location || ''} onChange={e => updateField('location', e.target.value)} placeholder="e.g. Bangalore, India" />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-sm font-semibold flex items-center justify-between">
                      Portfolio / Proof Link
                      {profile?.publicSlug && (
                        <button 
                          onClick={() => updateField('portfolioUrl', `${window.location.origin}/p/${profile.publicSlug}`)}
                          className="text-xs text-primary hover:underline"
                        >
                          Auto-fill Proof Link
                        </button>
                      )}
                    </label>
                    <Input value={resume.portfolioUrl || ''} onChange={e => updateField('portfolioUrl', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader title="Professional Summary" sectionKey="summary" />
              {expandedSections.summary && (
                <Textarea
                  value={resume.summary}
                  onChange={e => updateField('summary', e.target.value)}
                  placeholder="A concise 2-3 sentence professional summary..."
                  className="min-h-[100px] mt-2"
                />
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader title="Work Experience" sectionKey="experience" count={resume.experience.length} />
              {expandedSections.experience && (
                <div className="space-y-6 mt-2">
                  {resume.experience.map((exp) => (
                    <div key={exp.id} className="relative border rounded-lg p-4 space-y-3 bg-muted/20">
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-red-500 hover:text-red-600" onClick={() => removeExperience(exp.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Job Title</label>
                          <Input value={exp.title} onChange={e => updateExperience(exp.id, 'title', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Company</label>
                          <Input value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Key Achievements & Responsibilities (one per line)</label>
                        <Textarea
                          value={exp.bullets.join('\n')}
                          onChange={e => updateExperience(exp.id, 'bullets', e.target.value.split('\n'))}
                          className="min-h-[80px]"
                          placeholder="• Built a real-time notification system serving 10K users..."
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addExperience} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Experience
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader title="Education" sectionKey="education" count={resume.education.length} />
              {expandedSections.education && (
                <div className="space-y-4 mt-2">
                  {resume.education.map((edu) => (
                    <div key={edu.id} className="relative border rounded-lg p-4 bg-muted/20">
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-red-500 hover:text-red-600" onClick={() => removeEducation(edu.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Degree</label>
                          <Input value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Institution</label>
                          <Input value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addEducation} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Education
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader title="Skills" sectionKey="skills" count={resume.skills.length} />
              {expandedSections.skills && (
                <div className="mt-2 space-y-3">
                  <Textarea
                    value={resume.skills.join(', ')}
                    onChange={e => updateField('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="JavaScript, TypeScript, React, Node.js, PostgreSQL..."
                    className="min-h-[60px]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader title="Projects" sectionKey="projects" count={resume.projects.length} />
              {expandedSections.projects && (
                <div className="space-y-4 mt-2">
                  {resume.projects.map((proj) => (
                    <div key={proj.id} className="relative border rounded-lg p-4 space-y-3 bg-muted/20">
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-red-500 hover:text-red-600" onClick={() => removeProject(proj.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Project Name</label>
                          <Input value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">URL (optional)</label>
                          <Input value={proj.url || ''} onChange={e => updateProject(proj.id, 'url', e.target.value)} placeholder="https://github.com/..." />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Description</label>
                        <Textarea value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} className="min-h-[60px]" />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProject} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Version Manager */}
        <div className="space-y-6 print:hidden">
          <div>
            <h3 className="text-lg font-bold font-headline flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" /> Job-Specific Versions
            </h3>
            <p className="text-sm text-muted-foreground">Generate optimized resume versions for specific job destinations.</p>
          </div>

          {/* Active Jobs to generate versions for */}
          {jobs && jobs.length > 0 && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Generate for a Destination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {jobs.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="flex justify-between items-center text-sm p-2 rounded border bg-background/50">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="text-xs h-7 shrink-0 ml-2"
                      onClick={() => handleGenerate(job.id)}
                      disabled={isGenerating[job.id]}
                    >
                      {isGenerating[job.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <h4 className="text-sm font-bold mb-3">Saved Versions ({versions.length})</h4>
            {versions.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="No versions yet"
                description="Save your master resume first, then generate destination-specific versions for your jobs."
                className="min-h-[250px] p-6"
                action={
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Master Resume
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {versions.map(v => (
                  <Card key={v.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{v.jobTitle}</p>
                          <p className="text-xs text-muted-foreground">{v.company}</p>
                          {v.atsScore && <Badge variant="secondary" className="text-xs mt-1">ATS: {v.atsScore}%</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href={`/resume-builder/${v.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary h-7 px-2">
                              View
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-red-500 h-7 px-2" onClick={() => handleDeleteVersion(v.id!)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-2">
              <Link href="/resumes">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <FileText className="w-3 h-3 mr-2" /> Upload Existing Resume
                </Button>
              </Link>
              <Link href="/proof-builder">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Briefcase className="w-3 h-3 mr-2" /> Proof Builder
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
