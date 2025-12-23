"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Key,
  Bell,
  Palette,
  Shield,
  Trash2,
  Plus,
  Copy,
  Check,
  Sun,
  Moon,
  Monitor,
  Camera,
  Save,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { settingsService, type ApiKey, type NotificationPreferences, type ThemeSettings } from "@/services/settings.service";
import { formatRelativeTime, cn } from "@/lib/utils";

// Profile Tab
function ProfileTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const { toast } = useToast();

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await settingsService.updateProfile({ name, email });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [name, email, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and profile picture.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
            <AvatarFallback className="text-2xl">JD</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="h-4 w-4" />
              Change Photo
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, GIF or PNG. Max size 2MB.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}

// API Keys Tab
function ApiKeysTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([
    {
      id: "1",
      name: "Development Key",
      prefix: "vibe_live_",
      key: "vibe_live_abc123...",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      name: "Production Key",
      prefix: "vibe_live_",
      key: "vibe_live_xyz789...",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateKey = useCallback(async () => {
    if (!newKeyName.trim()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const rawKey = `vibe_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      const createdKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        prefix: "vibe_",
        key: `${rawKey.substring(0, 10)}...`,
        createdAt: new Date().toISOString(),
      };
      
      setNewKey(rawKey);
      setKeys((prev) => [createdKey, ...prev]);
      setNewKeyName("");
      
      toast({
        title: "API Key Created",
        description: "Make sure to copy your key. You won't be able to see it again.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [newKeyName, toast]);

  const handleDeleteKey = useCallback(async (keyId: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
    toast({
      title: "API Key Deleted",
      description: "The API key has been revoked permanently.",
    });
  }, [toast]);

  const copyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage your API keys for accessing the platform programmatically.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  API keys provide programmatic access to the platform. Keep them secure.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {newKey ? (
                  <div className="space-y-4">
                    <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Make sure to copy your key now
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            You won't be able to see it again after closing this dialog.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your API Key</label>
                      <div className="flex gap-2">
                        <Input value={newKey} readOnly className="font-mono bg-muted" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyKey(newKey)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="keyName" className="text-sm font-medium">
                        Key Name
                      </label>
                      <Input
                        id="keyName"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Development Key"
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setNewKey(null);
                  }}
                >
                  {newKey ? "Close" : "Cancel"}
                </Button>
                {!newKey && (
                  <Button onClick={handleCreateKey} disabled={isLoading || !newKeyName.trim()}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Key
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {key.prefix}••••••••••••{key.key.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">{formatRelativeTime(key.createdAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteKey(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Notifications Tab
function NotificationsTab() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      securityAlerts: true,
      productUpdates: false,
      deploymentStatus: true,
      weeklyDigest: true,
    },
    push: {
      securityAlerts: true,
      deploymentStatus: true,
      mentions: false,
    },
    inApp: {
      securityAlerts: true,
      deploymentStatus: true,
      mentions: true,
      projectInvites: true,
    },
  });

  const updatePreference = useCallback(
    (
      channel: keyof NotificationPreferences,
      key: string,
      value: boolean
    ) => {
      setPreferences((prev) => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          [key]: value,
        },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    try {
      await settingsService.updateNotificationPreferences(preferences);
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  }, [preferences, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you want to receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Email Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "securityAlerts", label: "Security Alerts" },
              { key: "productUpdates", label: "Product Updates" },
              { key: "deploymentStatus", label: "Deployment Status" },
              { key: "weeklyDigest", label: "Weekly Digest" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={preferences.email[item.key as keyof typeof preferences.email]}
                  onCheckedChange={(checked) =>
                    updatePreference("email", item.key, checked)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Push Notifications
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "securityAlerts", label: "Security Alerts" },
              { key: "deploymentStatus", label: "Deployment Status" },
              { key: "mentions", label: "Mentions" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={preferences.push[item.key as keyof typeof preferences.push]}
                  onCheckedChange={(checked) =>
                    updatePreference("push", item.key, checked)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            In-App Notifications
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "securityAlerts", label: "Security Alerts" },
              { key: "deploymentStatus", label: "Deployment Status" },
              { key: "mentions", label: "Mentions" },
              { key: "projectInvites", label: "Project Invites" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={preferences.inApp[item.key as keyof typeof preferences.inApp]}
                  onCheckedChange={(checked) =>
                    updatePreference("inApp", item.key, checked)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
}

// Theme Tab
function ThemeTab() {
  const { theme, setTheme } = useTheme();
  const [colorScheme, setColorScheme] = useState<ThemeSettings["colorScheme"]>("blue");
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const { toast } = useToast();

  const colorSchemes = [
    { value: "blue" as const, label: "Blue", className: "bg-blue-500" },
    { value: "green" as const, label: "Green", className: "bg-green-500" },
    { value: "purple" as const, label: "Purple", className: "bg-purple-500" },
    { value: "orange" as const, label: "Orange", className: "bg-orange-500" },
    { value: "pink" as const, label: "Pink", className: "bg-pink-500" },
  ];

  const handleSave = useCallback(async () => {
    try {
      await settingsService.updateThemeSettings({
        theme: theme as "light" | "dark" | "system",
        colorScheme,
        compactMode,
        animations,
      });
      toast({
        title: "Theme saved",
        description: "Your theme preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save theme settings. Please try again.",
        variant: "destructive",
      });
    }
  }, [theme, colorScheme, compactMode, animations, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the platform looks and feels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Theme Selection */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Theme</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { value: "light" as const, label: "Light", icon: Sun },
              { value: "dark" as const, label: "Dark", icon: Moon },
              { value: "system" as const, label: "System", icon: Monitor },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  onClick={() => setTheme(item.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                    theme === item.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Scheme */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Color Scheme</h4>
          <div className="flex gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value)}
                className={cn(
                  "h-10 w-10 rounded-full transition-transform",
                  scheme.className,
                  colorScheme === scheme.value
                    ? "scale-110 ring-2 ring-offset-2 ring-primary"
                    : "hover:scale-105"
                )}
                title={scheme.label}
              />
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Options</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Compact Mode</p>
                <p className="text-xs text-muted-foreground">
                  Reduce spacing for more content
                </p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Animations</p>
                <p className="text-xs text-muted-foreground">
                  Enable smooth transitions
                </p>
              </div>
              <Switch checked={animations} onCheckedChange={setAnimations} />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Theme
        </Button>
      </CardFooter>
    </Card>
  );
}

// Icon components that might be missing
function Mail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

// Main Settings Page Component
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="appearance">
          <ThemeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
