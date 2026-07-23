import { notFound } from "next/navigation";
import { 
  BarChart3, 
  FileText, 
  Globe, 
  KanbanSquare, 
  MessageSquare, 
  Wand2,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Download,
  Smartphone,
  Laptop,
  Chrome
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const FEATURE_DATA: Record<string, any> = {
  "job-analysis": {
    title: "Smart Job Match Analysis",
    subtitle: "Stop guessing. Start knowing your worth for every role.",
    icon: <BarChart3 className="w-12 h-12 text-primary" />,
    description: "Our advanced AI engine parses job descriptions in real-time and compares them against your unique professional profile. We don't just look for keywords; we understand the semantic intent behind job requirements.",
    benefits: [
      "Calculates a real-time 'Career Fit' percentage for any role.",
      "Identifies specific skill gaps and provides learning recommendations.",
      "Analyzes company culture and mission alignment automatically.",
      "Saves hours of manual comparison per week."
    ],
    videoPlaceholder: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426",
  },
  "resume-management": {
    title: "Resume & Profile Management",
    subtitle: "Your professional story, indexed and ready for action.",
    icon: <FileText className="w-12 h-12 text-primary" />,
    description: "Keep your professional data structured and secure. Our intelligent parsing engine converts your static resume into a dynamic, queryable profile that serves as the foundation for all AI optimization.",
    benefits: [
      "Upload multiple versions of your resume for different paths.",
      "Automatic parsing into structured work history and skills.",
      "Real-time profile strength assessment.",
      "Cloud-based access from anywhere, anytime."
    ],
    videoPlaceholder: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2340",
  },
  "application-generator": {
    title: "Tailored Application Generator",
    subtitle: "Craft the perfect pitch for every single application.",
    icon: <Wand2 className="w-12 h-12 text-primary" />,
    description: "Standard resumes get ignored. Tailored ones get interviews. Our generator crafts job-specific bullet points and cover letters that speak directly to the hiring manager's needs, using your actual experience as proof.",
    benefits: [
      "Generate custom cover letters in seconds.",
      "Smart resume bullet-point rewriting for specific jobs.",
      "Maintains your unique voice while optimizing for ATS.",
      "Ensures maximum relevance for every submission."
    ],
    videoPlaceholder: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=2340",
  },
  "application-tracker": {
    title: "Comprehensive Application Tracker",
    subtitle: "Never let an opportunity fall through the cracks.",
    icon: <KanbanSquare className="w-12 h-12 text-primary" />,
    description: "A centralized command center for your entire job search. Track status, set reminders, and sync analytics for every company you apply to.",
    benefits: [
      "Visual Kanban board for application stages.",
      "Automated follow-up reminders.",
      "Success rate analytics and conversion tracking.",
      "Detailed notes and interview logs for each role."
    ],
    videoPlaceholder: "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=2340",
  },
  "browser-extension": {
    title: "Browser Extension",
    subtitle: "The power of CareerPilot AI, everywhere you browse.",
    icon: <Globe className="w-12 h-12 text-primary" />,
    description: "Analyze jobs directly on LinkedIn, Indeed, and glassdoor without leaving the page. Our extension provides a floating overlay with your match score and instant optimization tips.",
    benefits: [
      "One-click 'Save to Tracker' from any job board.",
      "Instant match score overlay on job listings.",
      "Quick-access profile summaries while applying.",
      "Syncs instantly with your web dashboard."
    ],
    videoPlaceholder: "https://images.unsplash.com/photo-1481487196290-c152efe083f5?auto=format&fit=crop&q=80&w=2324",
    downloadLink: "https://chrome.google.com/webstore", // Placeholder for actual store link
  },
  "interview-prep": {
    title: "Intelligent Preparation",
    subtitle: "Go into every interview with confidence and clarity.",
    icon: <MessageSquare className="w-12 h-12 text-primary" />,
    description: "Using the job description and your profile, our AI predicts the most likely technical and behavioral questions you'll face. We provide talking points tailored to your specific past achievements.",
    benefits: [
      "Predicted interview questions based on job requirements.",
      "AI-generated 'STAR' method responses for your experience.",
      "Tone and confidence coaching tips.",
      "Comprehensive research briefs on target companies."
    ],
    videoPlaceholder: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=2340",
  }
};

export default function FeaturePage({ params }: { params: { slug: string } }) {
  const feature = FEATURE_DATA[params.slug];

  if (!feature) {
    notFound();
  }

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      {/* Hero Section */}
      <section className="bg-white border-b py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="mb-6">{feature.icon}</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold mb-4">
              {feature.title}
            </h1>
            <p className="text-xl md:text-2xl text-primary font-medium mb-6">
              {feature.subtitle}
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {feature.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {params.slug === "browser-extension" ? (
                <Link href={feature.downloadLink} target="_blank">
                  <Button size="lg" className="h-14 px-8 gap-2 shadow-xl">
                    <Download className="w-5 h-5" />
                    Download Extension
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-8 shadow-xl">
                    Get Started Free
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="container mx-auto px-4 -mt-10 mb-16">
        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden border-none shadow-2xl glass">
            <div className="aspect-video relative group cursor-pointer bg-slate-900">
              <img 
                src={feature.videoPlaceholder} 
                alt={`${feature.title} Demo`}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <PlayCircle className="w-20 h-20 mb-4 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-2xl font-bold font-headline mb-2">Watch the {feature.title} Demo</h3>
                <p className="text-white/80 max-w-md">See how our AI helps you land your next role in just 2 minutes.</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-headline mb-10 text-center flex items-center justify-center gap-3">
            <Sparkles className="text-primary" />
            Why it works
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {feature.benefits.map((benefit: string, idx: number) => (
              <div key={idx} className="flex gap-4 p-6 bg-white rounded-2xl border border-primary/5 shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <p className="text-slate-700 font-medium leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unified Account Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-8 md:p-16 text-white overflow-hidden relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm mb-6 border border-white/5">
                <Sparkles className="w-4 h-4" />
                Unified Intelligence
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-headline mb-6">
                One Account. <br/> Works Everywhere.
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                Your CareerPilot AI profile is independent of device. Whether you are analyzing jobs on our website, tracking applications on your phone, or using the browser extension, your intelligence stays synced.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Laptop className="w-5 h-5" />, text: "Desktop Web Platform" },
                  { icon: <Smartphone className="w-5 h-5" />, text: "Mobile Companion App" },
                  { icon: <Chrome className="w-5 h-5" />, text: "Smart Browser Extension" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                    <span className="font-medium text-white/90">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square lg:aspect-auto h-[300px] lg:h-[400px] flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse"></div>
              <div className="relative grid grid-cols-2 gap-4">
                <div className="aspect-[4/3] bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl skew-y-6">
                  <div className="w-full h-8 bg-white/10 rounded-md mb-2"></div>
                  <div className="w-2/3 h-4 bg-white/10 rounded-md"></div>
                </div>
                <div className="aspect-[4/3] bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl -skew-y-6 translate-y-20">
                  <div className="w-full h-8 bg-white/10 rounded-md mb-2"></div>
                  <div className="w-2/3 h-4 bg-white/10 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative gradients */}
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full translate-x-1/4 translate-y-1/4"></div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 mt-20">
        <div className="max-w-4xl mx-auto bg-primary rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6">
              Start using the {feature.title} today
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl text-lg">
              Unlock the full potential of CareerPilot AI. Your account gives you full access to our web platform, mobile app, and browser extension instantly.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="font-bold px-8 h-14 text-lg">
                Create Free Account
              </Button>
            </Link>
          </div>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        </div>
      </section>
    </div>
  );
}
