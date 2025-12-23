"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Loader2, Terminal, GitBranch, Package, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Template type
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  techStack: string[];
}

// Templates data
const templates: ProjectTemplate[] = [
  {
    id: "nextjs-fullstack",
    name: "Next.js Fullstack",
    description: "Full-stack app with App Router, TypeScript, and database integration",
    icon: <Globe className="h-6 w-6" />,
    category: "fullstack",
    techStack: ["Next.js 14", "TypeScript", "Prisma", "PostgreSQL"],
  },
  {
    id: "react-dashboard",
    name: "React Dashboard",
    description: "Admin dashboard with authentication, routing, and UI components",
    icon: <Check className="h-6 w-6" />,
    category: "frontend",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query"],
  },
  {
    id: "express-api",
    name: "Express API",
    description: "REST API boilerplate with authentication and testing setup",
    icon: <Terminal className="h-6 w-6" />,
    category: "backend",
    techStack: ["Node.js", "Express", "TypeScript", "Jest"],
  },
  {
    id: "python-fastapi",
    name: "Python FastAPI",
    description: "Modern Python API with async database access",
    icon: <Package className="h-6 w-6" />,
    category: "backend",
    techStack: ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL"],
  },
  {
    id: "golang-microservice",
    name: "Go Microservice",
    description: "Microservice template with Docker and Kubernetes support",
    icon: <GitBranch className="h-6 w-6" />,
    category: "microservice",
    techStack: ["Go", "Docker", "Kubernetes", "gRPC"],
  },
  {
    id: "react-native",
    name: "React Native",
    description: "Cross-platform mobile app with Expo",
    icon: <Globe className="h-6 w-6" />,
    category: "mobile",
    techStack: ["React Native", "Expo", "TypeScript"],
  },
];

// Step components
interface WizardStepProps {
  onNext: () => void;
  onBack?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isLoading?: boolean;
}

function TemplateStep({ onNext }: WizardStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Choose a Template</h2>
        <p className="text-muted-foreground">Select a starting point for your project</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedTemplate === template.id
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            )}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardHeader className="pb-2">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center mb-2",
                "bg-primary/10 text-primary"
              )}>
                {template.icon}
              </div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-xs">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1">
                {template.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs px-2 py-0.5 bg-muted rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onNext} disabled={!selectedTemplate}>
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ConfigStep({ onNext, onBack }: WizardStepProps) {
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setProjectName(name);
    setProjectSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Project Details</h2>
        <p className="text-muted-foreground">Configure your new project</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            placeholder="My Awesome Project"
            value={projectName}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Project Slug</Label>
          <div className="flex items-center">
            <span className="text-muted-foreground text-sm mr-2">myapp.com/</span>
            <Input
              id="slug"
              placeholder="my-awesome-project"
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            placeholder="A brief description of your project"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <RadioGroup value={visibility} onValueChange={setVisibility}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private">Private</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public">Public</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!projectName || !projectSlug}>
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface LogEntry {
  timestamp: Date;
  type: "info" | "success" | "error" | "command";
  message: string;
}

function ProvisioningStep({ isLoading, onBack }: WizardStepProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Simulate provisioning process
  React.useEffect(() => {
    if (!isLoading) return;

    const steps = [
      { message: "Initializing project...", type: "info" as const, delay: 500 },
      { message: "Cloning template...", type: "info" as const, delay: 1000 },
      { message: "Installing dependencies...", type: "command" as const, delay: 1500 },
      { message: "npm packages installed", type: "success" as const, delay: 4000 },
      { message: "Initializing Git repository...", type: "info" as const, delay: 4500 },
      { message: "Git repository initialized", type: "success" as const, delay: 5000 },
      { message: "Creating initial commit...", type: "command" as const, delay: 5500 },
      { message: "Initial commit created", type: "success" as const, delay: 6000 },
      { message: "Setting up CI/CD...", type: "info" as const, delay: 6500 },
      { message: "CI/CD configured", type: "success" as const, delay: 7000 },
      { message: "Project ready!", type: "success" as const, delay: 7500 },
    ];

    let currentStep = 0;

    const runStep = () => {
      if (currentStep >= steps.length) {
        setIsComplete(true);
        return;
      }

      const step = steps[currentStep];
      setLogs((prev) => [...prev, {
        timestamp: new Date(),
        type: step.type,
        message: step.message,
      }]);
      setProgress(((currentStep + 1) / steps.length) * 100);
      currentStep++;

      setTimeout(runStep, steps[currentStep - 1].delay - (steps[currentStep - 2]?.delay || 0));
    };

    runStep();
  }, [isLoading]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">
          {isComplete ? "Project Created!" : "Setting Up Your Project"}
        </h2>
        <p className="text-muted-foreground">
          {isComplete ? "Redirecting to your new project..." : "This may take a few moments..."}
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Progress value={progress} className="mb-4" />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2 font-mono text-sm">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2",
                      log.type === "success" && "text-green-500",
                      log.type === "error" && "text-red-500",
                      log.type === "command" && "text-blue-400",
                      log.type === "info" && "text-muted-foreground"
                    )}
                  >
                    <span className="text-xs opacity-50 mt-0.5">
                      {log.timestamp.toLocaleTimeString([], { hour12: false })}
                    </span>
                    <span>
                      {log.type === "command" ? "$ " : ""}
                      {log.message}
                    </span>
                  </div>
                ))}
                {!isComplete && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-6">
        {isComplete && (
          <Button onClick={onBack}>
            Go to Project
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Main Wizard Component
export function NewProjectWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    templateId: "",
    name: "",
    slug: "",
    description: "",
    visibility: "private",
  });

  const steps = [
    { title: "Template", component: TemplateStep },
    { title: "Details", component: ConfigStep },
    { title: "Setup", component: ProvisioningStep },
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Complete - redirect to project
      router.push("/dashboard/projects/new-project-id");
    }
  }, [currentStep, router]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              ×
            </Button>
            <CardTitle>Create New Project</CardTitle>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {steps.map((step, i) => (
              <React.Fragment key={step.title}>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    i <= currentStep ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      i < currentStep
                        ? "bg-primary text-primary-foreground"
                        : i === currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                    )}
                  >
                    {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="text-sm hidden sm:inline">{step.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5",
                      i < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <CurrentStepComponent
            onNext={handleNext}
            onBack={handleBack}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default NewProjectWizard;
