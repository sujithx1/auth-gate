import React, { useState, useEffect } from "react";
import { Building2, UserPlus, Plus, Users, ArrowLeft, RefreshCw, Check } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface OrganizationsProps {
  onBack: () => void;
  onError: (msg: string) => void;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
}

export default function Organizations({ onBack, onError }: OrganizationsProps) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Create organization form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Invite member form
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  // Accept invitation form
  const [acceptToken, setAcceptToken] = useState("");
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  useEffect(() => {
    fetchOrgs();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchMembers(selectedOrg.id);
    }
  }, [selectedOrg]);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/api/orgs");
      setOrgs(res.data.orgs || []);
    } catch (e: any) {
      onError(e.error?.message || "Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    try {
      const res: any = await api.get(`/api/orgs/${orgId}/members`);
      setMembers(res.data.members || []);
    } catch (e: any) {
      onError(e.error?.message || "Failed to load members.");
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onError("Please enter organization name.");
      return;
    }
    if (!slug.trim()) {
      onError("Please enter organization slug.");
      return;
    }
    setCreateLoading(true);
    try {
      await api.post("/api/orgs", { name: name.trim(), slug: slug.trim() });
      setName("");
      setSlug("");
      fetchOrgs();
    } catch (e: any) {
      onError(e.error?.message || "Failed to create organization.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    if (!email.trim()) {
      onError("Please enter invitee email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      onError("Please enter a valid email address.");
      return;
    }

    setInviteLoading(true);
    setInviteToken(null);
    try {
      const res: any = await api.post(`/api/orgs/${selectedOrg.id}/invite`, { email: email.trim(), role });
      setEmail("");
      setInviteToken(res.data.invitation.token);
      fetchMembers(selectedOrg.id);
    } catch (e: any) {
      onError(e.error?.message || "Failed to send invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptToken.trim()) {
      onError("Please enter invitation token.");
      return;
    }
    setAcceptLoading(true);
    setAcceptSuccess(false);
    try {
      await api.post(`/api/orgs/invitations/${acceptToken.trim()}/accept`);
      setAcceptToken("");
      setAcceptSuccess(true);
      fetchOrgs();
    } catch (e: any) {
      onError(e.error?.message || "Failed to accept invitation.");
    } finally {
      setAcceptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Organizations</h2>
          <p className="text-slate-400 text-xs">Manage workspaces, members, and invitations</p>
        </div>
      </div>

      {selectedOrg ? (
        <Card className="border-purple-500/20">
          <CardHeader className="flex flex-row justify-between items-start border-b border-border/40 pb-5">
            <div>
              <CardTitle className="text-lg">{selectedOrg.name}</CardTitle>
              <CardDescription>Slug: {selectedOrg.slug}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedOrg(null)}>
              Change Org
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Members List ({members.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map((m) => (
                  <div key={m.id} className="flex justify-between items-center p-3 rounded bg-slate-900/60 border border-slate-800 text-xs">
                    <span className="font-mono text-slate-300">User ID: {m.userId.substring(0, 8)}...</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form noValidate onSubmit={handleInvite} className="space-y-4 border-t border-border/40 pt-5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" />
                Invite Member
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="member@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-role">Role</Label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-800 bg-slate-900 text-white text-sm"
                  >
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={inviteLoading}>
                {inviteLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Send Invite
              </Button>

              {inviteToken && (
                <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg text-xs space-y-1 text-slate-300 mt-2">
                  <p className="font-semibold text-purple-400">Dev Mode Invitation Token:</p>
                  <code className="block select-all break-all bg-slate-900/60 p-2 rounded border border-slate-800 text-purple-300">
                    {inviteToken}
                  </code>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspaces</CardTitle>
              <CardDescription>Select a workspace to manage its configurations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-6 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : orgs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">You don't belong to any organizations yet.</p>
              ) : (
                <div className="space-y-2">
                  {orgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => setSelectedOrg(org)}
                      className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-900 hover:bg-slate-900/80 border border-slate-800 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-purple-400" />
                        <div>
                          <span className="font-semibold text-white text-sm block">{org.name}</span>
                          <span className="text-slate-400 text-xs">{org.slug}</span>
                        </div>
                      </div>
                      <span className="text-xs text-purple-400 hover:underline font-medium">Manage →</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <form noValidate onSubmit={handleCreateOrg}>
                <CardHeader>
                  <CardTitle className="text-lg">Create Organization</CardTitle>
                  <CardDescription>Establish a new workspace entity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      placeholder="e.g. Acme Corp"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="org-slug">Unique Slug</Label>
                    <Input
                      id="org-slug"
                      placeholder="e.g. acme"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={createLoading}>
                    {createLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Workspace
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card>
              <form noValidate onSubmit={handleAcceptInvitation}>
                <CardHeader>
                  <CardTitle className="text-lg">Accept Invitation</CardTitle>
                  <CardDescription>Join an existing organization via invitation token</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="accept-token">Invitation Token</Label>
                    <Input
                      id="accept-token"
                      placeholder="Enter invite token code"
                      value={acceptToken}
                      onChange={(e) => setAcceptToken(e.target.value)}
                    />
                  </div>
                  {acceptSuccess && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs flex gap-2 items-center text-emerald-300">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Successfully joined organization!</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" variant="outline" className="w-full border-purple-800 text-purple-300" disabled={acceptLoading}>
                    {acceptLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Building2 className="w-4 h-4 mr-2" />}
                    Accept & Join
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
