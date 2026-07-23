'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { useParams, useRouter } from 'next/navigation';
import { getMasterResume, getResumeVersion, MasterResume, ResumeVersion } from '@/actions/resume-builder-actions';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ResumeVersionViewPage() {
  const { user, isUserLoading } = useUser();
  const { versionId } = useParams();
  const router = useRouter();
  
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null);
  const [version, setVersion] = useState<ResumeVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const [masterRes, versionRes] = await Promise.all([
          getMasterResume(token),
          getResumeVersion(token, versionId as string)
        ]);

        if (masterRes.success) setMasterResume(masterRes.resume);
        if (versionRes.success) setVersion(versionRes.version);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user, versionId]);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading Document...</p>
      </div>
    );
  }

  if (!masterResume || !version) {
    return <div className="p-8 text-center text-muted-foreground">Resume version not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-in fade-in duration-500">
      
      {/* Controls - Hidden when printing */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="ghost" asChild>
          <Link href="/resume-builder">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Builder
          </Link>
        </Button>
        <div className="flex gap-2">
          {version.jobId && (
            <Button variant="secondary" asChild>
              <Link href={`/jobs/${version.jobId}`}>
                Continue to Application
              </Link>
            </Button>
          )}
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print to PDF
          </Button>
        </div>
      </div>

      {/* Actual Resume Document */}
      <div className="bg-white text-black p-8 sm:p-12 shadow-sm border print:shadow-none print:border-none print:p-0 font-sans">
        
        {/* Header */}
        <header className="text-center mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-3xl font-bold uppercase tracking-wider">{masterResume.fullName}</h1>
          <p className="text-lg text-gray-700 mt-1">{masterResume.headline}</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
            {masterResume.email && <span>{masterResume.email}</span>}
            {masterResume.phone && <span>• {masterResume.phone}</span>}
            {masterResume.location && <span>• {masterResume.location}</span>}
          </div>
        </header>

        {/* Summary (Optimized) */}
        {version.optimizedSummary && (
          <section className="mb-6">
            <h2 className="text-lg font-bold border-b border-gray-300 mb-2 uppercase text-gray-800 tracking-wider">Professional Summary</h2>
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{version.optimizedSummary}</p>
          </section>
        )}

        {/* Experience (Optimized) */}
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 mb-2 uppercase text-gray-800 tracking-wider">Experience</h2>
          <div className="space-y-4">
            {version.optimizedExperience.map((exp: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-gray-900">{exp.title}</h3>
                    <p className="text-sm font-semibold text-gray-700">{exp.company} {exp.location ? `- ${exp.location}` : ''}</p>
                  </div>
                  <span className="text-sm text-gray-600 shrink-0 ml-4">
                    {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 mt-1.5">
                  {exp.bullets.map((bullet: string, j: number) => (
                    <li key={j} className="text-sm text-gray-700 leading-relaxed pl-1">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education (From Master) */}
        {masterResume.education && masterResume.education.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold border-b border-gray-300 mb-2 uppercase text-gray-800 tracking-wider">Education</h2>
            <div className="space-y-3">
              {masterResume.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                    <p className="text-sm text-gray-700">{edu.institution}</p>
                  </div>
                  <span className="text-sm text-gray-600">{edu.graduationDate}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills (Optimized) */}
        {version.optimizedSkills && version.optimizedSkills.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold border-b border-gray-300 mb-2 uppercase text-gray-800 tracking-wider">Skills</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {version.optimizedSkills.join(', ')}
            </p>
          </section>
        )}

        {/* Projects (From Master) */}
        {masterResume.projects && masterResume.projects.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold border-b border-gray-300 mb-2 uppercase text-gray-800 tracking-wider">Projects</h2>
            <div className="space-y-3">
              {masterResume.projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-gray-900">{proj.name}</h3>
                    {proj.url && <a href={proj.url} className="text-xs text-blue-600 hover:underline">{proj.url}</a>}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
