import { User as UserIcon, LogOut } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface DashboardProps {
  user: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: string;
  };
  onLogout: () => void;
  onError: (msg: string) => void;
}

export default function Dashboard({ user, onLogout, onError }: DashboardProps) {
  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      onLogout();
    } catch (e: any) {
      onError("Logout failed.");
    }
  };

  return (
    <Card className="border-purple-500/30">
      <CardHeader className="border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl">User Console</CardTitle>
            <CardDescription className="text-purple-400">Status: Authenticated</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">User ID</span>
            <code className="text-xs text-slate-200 block bg-slate-900/60 p-2.5 rounded border border-slate-800 select-all font-mono">
              {user.id}
            </code>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Email</span>
              <span className="text-sm font-semibold text-white block mt-1 truncate">{user.email}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Verification status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mt-1.5 ${
                  user.isEmailVerified
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                }`}
              >
                {user.isEmailVerified ? "Verified" : "Pending Verification"}
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Joined At</span>
            <span className="text-sm text-slate-200 block mt-1">
              {new Date(user.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border/60 pt-6">
        <Button
          variant="outline"
          className="w-full border-red-900/40 text-red-400 hover:bg-red-950/20 hover:text-red-300"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
}
