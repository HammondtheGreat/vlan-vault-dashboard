import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme, THEMES } from "@/context/ThemeContext";
import { useAppSettings, useSmtpSettings } from "@/hooks/useAppSettings";
import * as api from "@/api/client";
import * as authApi from "@/api/auth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Settings as SettingsIcon, User, Mail, Globe, Eye, EyeOff, Users, Plus, Pencil, Trash2, Check, Palette, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "profile", label: "Profile", icon: User },
  { id: "users", label: "Users", icon: Users },
  { id: "smtp", label: "SMTP", icon: Mail },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className="min-h-screen grid-bg">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center gap-3 py-4">
          <button onClick={() => navigate("/")} className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Configure your IPAM instance</p>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-3xl px-4">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar nav */}
          <nav className="flex sm:flex-col gap-1 sm:w-44 shrink-0 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "profile" && <ProfileSettings user={user} />}
            {activeTab === "users" && <UserManagement currentUserId={user?.id} />}
            {activeTab === "smtp" && <SmtpSettingsPanel />}
          </div>
        </div>
      </main>
    </div>
  );
}

function GeneralSettings() {
  const { settings, isLoading, save } = useAppSettings();
  const { theme, setTheme } = useTheme();
  const [siteName, setSiteName] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setSiteName(settings.site_name);
      setPageTitle(settings.page_title);
      setFaviconUrl(settings.favicon_url || "");
    }
  }, [isLoading, settings]);

  const handleSave = async () => {
    setSaving(true);
    await save({ site_name: siteName, page_title: pageTitle, favicon_url: faviconUrl || null });
    document.title = pageTitle;
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = faviconUrl;
    }
    setSaving(false);
  };

  if (isLoading) return <SettingsCard title="General"><p className="text-muted-foreground text-sm">Loading…</p></SettingsCard>;

  return (
    <SettingsCard title="General" description="Customize your IPAM branding">
      <FieldGroup label="Theme" hint="Choose a dark theme for the interface">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left w-full ${
                theme === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-muted/50"
              }`}
            >
              <Palette className={`h-4 w-4 shrink-0 ${theme === t.id ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground block">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </div>
              {theme === t.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </FieldGroup>
      <FieldGroup label="Site Name" hint="Shown in the header and throughout the app">
        <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="bg-background border-border font-mono" placeholder="Warp9Net IPAM" />
      </FieldGroup>
      <FieldGroup label="Page Title" hint="Displayed in the browser tab">
        <Input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} className="bg-background border-border" placeholder="Warp9Net IPAM" />
      </FieldGroup>
      <FieldGroup label="Favicon URL" hint="URL to a .ico, .png, or .svg favicon image">
        <Input value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)} className="bg-background border-border font-mono text-xs" placeholder="https://example.com/favicon.ico" />
        {faviconUrl && (
          <div className="flex items-center gap-2 mt-2">
            <img src={faviconUrl} alt="Favicon preview" className="h-6 w-6 rounded" onError={(e) => (e.currentTarget.style.display = "none")} />
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>
        )}
      </FieldGroup>
      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </SettingsCard>
  );
}

function ProfileSettings({ user }: { user: any }) {
  const { profile, updateAvatar } = useUserProfile();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      if (profile.display_name) setDisplayName(profile.display_name);
    }
  }, [user, profile.display_name]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingAvatar(true);
    try {
      await updateAvatar(file);
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploadingAvatar(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(user.id, { display_name: displayName } as any);

      if (email !== user.email) {
        const { error } = await authApi.updateUserEmail(email);
        if (error) throw new Error(error.message);
        toast.info("Check your new email for a confirmation link");
      }

      if (newPassword) {
        if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); setSaving(false); return; }
        const { error } = await authApi.updateUserPassword(newPassword);
        if (error) throw new Error(error.message);
        setNewPassword("");
      }

      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const initials = (profile.display_name || user?.email || "U")
    .split(/[\s@]/)
    .map((s: string) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SettingsCard title="Profile" description="Manage your account information">
      {/* Avatar */}
      <div className="flex items-center gap-4 pb-2">
        <div className="relative group">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={profile.avatar_url || undefined} alt="Avatar" className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary text-lg font-medium">{initials}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {uploadingAvatar ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Upload className="h-5 w-5 text-white" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{profile.display_name || "No name set"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <button onClick={() => avatarInputRef.current?.click()} className="text-xs text-primary hover:underline mt-1">
            {uploadingAvatar ? "Uploading…" : "Change avatar"}
          </button>
        </div>
      </div>

      <FieldGroup label="Display Name">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background border-border" />
      </FieldGroup>
      <FieldGroup label="Email Address">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background border-border font-mono text-xs" />
      </FieldGroup>
      <FieldGroup label="New Password" hint="Leave blank to keep current password">
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background border-border" placeholder="••••••••" />
      </FieldGroup>
      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </SettingsCard>
  );
}

function SmtpSettingsPanel() {
  const { settings, isLoading, save } = useSmtpSettings();
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [useTls, setUseTls] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHost(settings.smtp_host);
      setPort(String(settings.smtp_port));
      setUsername(settings.smtp_username);
      setPassword(settings.smtp_password);
      setFromEmail(settings.from_email);
      setFromName(settings.from_name);
      setUseTls(settings.use_tls);
    }
  }, [isLoading, settings]);

  const handleSave = async () => {
    setSaving(true);
    await save({
      smtp_host: host,
      smtp_port: Number(port) || 587,
      smtp_username: username,
      smtp_password: password,
      from_email: fromEmail,
      from_name: fromName,
      use_tls: useTls,
    });
    setSaving(false);
  };

  if (isLoading) return <SettingsCard title="SMTP"><p className="text-muted-foreground text-sm">Loading…</p></SettingsCard>;

  return (
    <SettingsCard title="SMTP / Outgoing Mail" description="Configure your outgoing email server for future email alerts. For Fastmail, use smtp.fastmail.com on port 465 with TLS.">
      <FieldGroup label="SMTP Host">
        <Input value={host} onChange={(e) => setHost(e.target.value)} className="bg-background border-border font-mono text-xs" placeholder="smtp.fastmail.com" />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Port">
          <Input type="number" value={port} onChange={(e) => setPort(e.target.value)} className="bg-background border-border font-mono" placeholder="587" />
        </FieldGroup>
        <FieldGroup label="Use TLS">
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={useTls} onCheckedChange={setUseTls} />
            <span className="text-xs text-muted-foreground">{useTls ? "Enabled" : "Disabled"}</span>
          </div>
        </FieldGroup>
      </div>
      <FieldGroup label="Username">
        <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-background border-border font-mono text-xs" placeholder="you@fastmail.com" />
      </FieldGroup>
      <FieldGroup label="Password">
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background border-border font-mono text-xs pr-10" placeholder="App password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FieldGroup>
      <FieldGroup label="From Email">
        <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className="bg-background border-border font-mono text-xs" placeholder="alerts@yourdomain.com" />
      </FieldGroup>
      <FieldGroup label="From Name">
        <Input value={fromName} onChange={(e) => setFromName(e.target.value)} className="bg-background border-border" placeholder="Warp9Net IPAM" />
      </FieldGroup>
      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
          {saving ? "Saving…" : "Save SMTP Settings"}
        </Button>
      </div>
    </SettingsCard>
  );
}

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card/80 p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

interface ManagedUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  last_sign_in_at: string | null;
}

function UserManagement({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "list" } });
    if (error) { toast.error("Failed to load users"); setLoading(false); return; }
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setFormEmail("");
    setFormName("");
    setFormPassword("");
    setDialogOpen(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditUser(u);
    setFormEmail(u.email);
    setFormName(u.display_name);
    setFormPassword("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        const body: any = { action: "update", user_id: editUser.id, display_name: formName };
        if (formEmail !== editUser.email) body.email = formEmail;
        if (formPassword) body.password = formPassword;
        const { data, error } = await supabase.functions.invoke("manage-users", { body });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        toast.success("User updated");
      } else {
        if (!formEmail || !formPassword) { toast.error("Email and password required"); setSaving(false); return; }
        const { data, error } = await supabase.functions.invoke("manage-users", {
          body: { action: "create", email: formEmail, password: formPassword, display_name: formName },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        toast.success("User created");
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "delete", user_id: deleteTarget.id },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Delete failed");
    } else {
      toast.success("User deleted");
      fetchUsers();
    }
    setDeleteTarget(null);
  };

  return (
    <SettingsCard title="User Management" description="Add, edit, or remove users who can access this IPAM instance">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-1.5 bg-primary text-primary-foreground">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Display Name</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Last Sign In</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "bg-card/30" : ""}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-primary break-all">{u.email}</td>
                    <td className="px-4 py-2.5 text-foreground">{u.display_name || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs hidden sm:table-cell">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {u.id !== currentUserId && (
                          <button onClick={() => setDeleteTarget(u)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editUser ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FieldGroup label="Email">
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="bg-background border-border font-mono text-xs" placeholder="user@example.com" />
            </FieldGroup>
            <FieldGroup label="Display Name">
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-background border-border" placeholder="John Doe" />
            </FieldGroup>
            <FieldGroup label={editUser ? "New Password (leave blank to keep)" : "Password"}>
              <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="bg-background border-border" placeholder="••••••••" />
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">{saving ? "Saving…" : editUser ? "Save" : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Permanently remove <span className="font-mono text-foreground">{deleteTarget?.email}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsCard>
  );
}
