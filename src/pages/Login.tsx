import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Lock, Mail, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL || "/api";
    fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5000) })
      .then((r) => setApiReachable(r.ok))
      .catch(() => setApiReachable(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    try {
      const { error } = await authApi.signIn(email.trim(), password);
      if (error) throw new Error(error.message);
      navigate("/");
    } catch (err: any) {
      const msg = err.message || "Authentication failed";
      if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
        toast.error("Cannot reach the API server. Is the backend running?");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 mx-auto rounded-xl bg-primary/20 flex items-center justify-center glow-primary-strong">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Warp9Net IPAM</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {apiReachable === false && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Backend not reachable</p>
              <p className="text-muted-foreground mt-1">
                The API server isn't responding. Make sure the Docker stack is running
                (<code className="text-xs bg-muted px-1 rounded">docker compose up -d</code>).
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@warp9.net"
                className="pl-9 bg-muted/50 border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 bg-muted/50 border-border"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || apiReachable === false}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground/60">
          Private network management tool
        </p>
      </div>
    </div>
  );
}
