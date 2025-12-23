"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode,
  Terminal,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  Activity,
  Users,
  GitBranch,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "./MetricCard";
import { TrendsChart, ActivityBarChart, StatusPieChart } from "./TrendsChart";

// Mock data for analytics
const usageTrendsData = [
  { date: "Mon", usage: 120, codeGen: 45 },
  { date: "Tue", usage: 150, codeGen: 62 },
  { date: "Wed", usage: 180, codeGen: 78 },
  { date: "Thu", usage: 165, codeGen: 55 },
  { date: "Fri", usage: 200, codeGen: 90 },
  { date: "Sat", usage: 90, codeGen: 35 },
  { date: "Sun", usage: 70, codeGen: 25 },
];

const weeklyActivityData = [
  { day: "Mon", files: 24, tests: 156 },
  { day: "Tue", files: 35, tests: 234 },
  { day: "Wed", files: 42, tests: 312 },
  { day: "Thu", files: 28, tests: 198 },
  { day: "Fri", files: 51, tests: 345 },
  { day: "Sat", files: 15, tests: 89 },
  { day: "Sun", files: 8, tests: 45 },
];

const aiSuccessData = [
  { name: "Successful", value: 847 },
  { name: "Needs Review", value: 123 },
  { name: "Failed", value: 30 },
];

const tokensUsageData = [
  { date: "Week 1", tokens: 45000 },
  { date: "Week 2", tokens: 62000 },
  { date: "Week 3", tokens: 78000 },
  { date: "Week 4", tokens: 95000 },
];

const projectActivityData = [
  { project: "E-Commerce", activity: 85 },
  { project: "Dashboard", activity: 72 },
  { project: "API Service", activity: 68 },
  { project: "Mobile App", activity: 45 },
  { project: "ML Pipeline", activity: 38 },
];

export function UsageDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your usage and productivity metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="day">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Files Created"
          value="1,284"
          change={{ value: 12, trend: "up" }}
          icon={<FileCode className="h-5 w-5" />}
          description="This month"
        />
        <MetricCard
          title="Lines of Code"
          value="45.2K"
          change={{ value: 8, trend: "up" }}
          icon={<Terminal className="h-5 w-5" />}
          description="Generated this week"
        />
        <MetricCard
          title="AI Interactions"
          value="3,847"
          change={{ value: 23, trend: "up" }}
          icon={<Sparkles className="h-5 w-5" />}
          description="Total conversations"
        />
        <MetricCard
          title="Test Success Rate"
          value="94.2%"
          change={{ value: 2, trend: "up" }}
          icon={<CheckCircle2 className="h-5 w-5" }}
          description="Last 7 days"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Trends */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="area">
              <TabsList className="mb-4">
                <TabsTrigger value="area">Area</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
              <TabsContent value="area" className="mt-0">
                <TrendsChart data={usageTrendsData} />
              </TabsContent>
              <TabsContent value="bar" className="mt-0">
                <ActivityBarChart data={weeklyActivityData} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* AI Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Code Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart
              data={aiSuccessData}
              dataKey="value"
              nameKey="name"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Average generation time</span>
                <span className="font-medium">2.3s</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tokens used this month</span>
                <span className="font-medium">280K</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Token Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartSimple data={tokensUsageData} />
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly budget</span>
                <span className="font-medium">500K / 1M</span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "50%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Project Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectActivityData.map((project) => (
              <div key={project.project} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{project.project}</span>
                  <span className="text-muted-foreground">
                    {project.activity}% active
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${project.activity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: "2 hours ago", action: "Generated API endpoints", project: "E-Commerce", type: "code" },
              { time: "3 hours ago", action: "Ran 45 tests - All passed", project: "Dashboard", type: "test" },
              { time: "5 hours ago", action: "Fixed security vulnerability", project: "API Service", type: "security" },
              { time: "Yesterday", action: "Added user authentication", project: "Mobile App", type: "code" },
              { time: "Yesterday", action: "Deployed to staging", project: "E-Commerce", type: "deploy" },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`p-2 rounded-full ${
                    activity.type === "code"
                      ? "bg-primary/10 text-primary"
                      : activity.type === "test"
                        ? "bg-green-500/10 text-green-500"
                        : activity.type === "security"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {activity.type === "code" && <FileCode className="h-4 w-4" />}
                  {activity.type === "test" && <CheckCircle2 className="h-4 w-4" />}
                  {activity.type === "security" && <Activity className="h-4 w-4" />}
                  {activity.type === "deploy" && <Zap className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.project} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for simple line chart
function LineChartSimple({ data, className }: { data: any[]; className?: string }) {
  return (
    <div className={cn("w-full h-[200px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-primary">
                      {payload[0].value.toLocaleString()} tokens
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="tokens"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default UsageDashboard;
