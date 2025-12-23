"use client";

import React from "react";
import { useParams } from "next/navigation";
import { IDELayout } from "@/components/ide/IDELayout";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  // In a real app, you would fetch the project details here
  const projectName = "My Project";

  return <IDELayout projectId={projectId} projectName={projectName} />;
}
