import React, { useState, useEffect } from "react";
import { Laptop, Plus, ArrowLeft, RefreshCw, Key, Lock, Copy, Check } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";

interface ClientsProps {
  onBack: () => void;
  onError: (msg: string) => void;
}

interface OAuthClient {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  allowedGrantTypes: string[];
  createdAt: string;
}

export default function Clients({ onBack, onError }: ClientsProps) {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [redirectUrisInput, setRedirectUrisInput] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [newClient, setNewClient] = useState<OAuthClient | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/api/oauth/clients");
      setClients(res.data.clients || []);
    } catch (e: any) {
      onError(e.error?.message || "Failed to load client applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setNewClient(null);
    try {
      // Split comma separated redirect URIs
      const redirectUris = redirectUrisInput
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const res: any = await api.post("/api/oauth/clients", {
        name,
        redirectUris,
      });

      setName("");
      setRedirectUrisInput("");
      setNewClient(res.data.client);
      fetchClients();
    } catch (e: any) {
      onError(e.error?.message || "Failed to register application.");
    } finally {
      setCreateLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "id" | "secret") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
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
          <h2 className="text-2xl font-bold text-white">OAuth Clients</h2>
          <p className="text-slate-400 text-xs">Register and manage third-party client integrations</p>
        </div>
      </div>

      {newClient && (
        <Card className="border-emerald-500/30 bg-emerald-950/10">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-400">
              <Lock className="w-5 h-5" />
              <CardTitle className="text-lg">Application Registered Successfully</CardTitle>
            </div>
            <CardDescription className="text-emerald-500/80">
              Store these credentials securely. The client secret will not be displayed again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">CLIENT ID</span>
              <div className="flex gap-2">
                <code className="block flex-1 bg-slate-900/60 p-2.5 rounded border border-slate-800 text-xs text-white font-mono select-all">
                  {newClient.clientId}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(newClient.clientId, "id")}>
                  {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium block">CLIENT SECRET</span>
              <div className="flex gap-2">
                <code className="block flex-1 bg-slate-900/60 p-2.5 rounded border border-slate-800 text-xs text-purple-400 font-mono select-all">
                  {newClient.clientSecret}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(newClient.clientSecret, "secret")}>
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={() => setNewClient(null)}>
              Done
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Registered Applications</CardTitle>
            <CardDescription>Your registered OAuth 2.1 client applications</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
            ) : clients.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No applications registered yet.</p>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-white text-sm">{client.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                        OAuth 2.1
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Client ID:</span>
                        <code className="text-slate-200 font-mono select-all bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {client.clientId}
                        </code>
                      </div>
                      <div className="space-y-1 mt-2">
                        <span className="text-slate-400 font-medium">Authorized Redirect URIs:</span>
                        <div className="space-y-1 pl-2">
                          {client.redirectUris.map((uri, idx) => (
                            <code key={idx} className="block text-[11px] text-purple-300 select-all font-mono">
                              {uri}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <form onSubmit={handleCreateClient}>
            <CardHeader>
              <CardTitle className="text-lg">Register Client</CardTitle>
              <CardDescription>Configure a new client application credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-name">Application Name</Label>
                <Input
                  id="client-name"
                  placeholder="e.g. My Developer Dashboard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-redirects">Redirect URIs</Label>
                <Input
                  id="client-redirects"
                  placeholder="Comma separated redirect URLs"
                  value={redirectUrisInput}
                  onChange={(e) => setRedirectUrisInput(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={createLoading}>
                {createLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Register Client
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
