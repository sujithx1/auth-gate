import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

export function SetupDoc() {
  const [installTab, setInstallTab] = useState<"npm" | "bun" | "deno">("npm");
  const [codeTab, setCodeTab] = useState<"bun" | "node" | "deno">("bun");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Getting Started</h2>
        <p className="text-sm text-muted-foreground">
          The AuthGate client SDK is a universal wrapper around the AuthGate API, providing type-safe methods to handle authentication across multiple environments.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">When is this helpful?</h3>
        <p className="text-sm text-muted-foreground">
          You should use the SDK whenever you are building a frontend application or a backend service that needs to verify sessions, manage users, or interact with the AuthGate ecosystem. It works seamlessly across Node.js, Bun, Deno, and the browser.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Solving the problem</h3>
        <p className="text-sm text-muted-foreground">
          Directly calling REST APIs with \`fetch\` requires manually passing credentials, parsing errors, managing base URLs, and repeating typing information across your codebase. This leads to brittle integrations.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">How this SDK does it</h3>
        <p className="text-sm text-muted-foreground">
          First, install the SDK via your package manager:
        </p>
        <div className="flex gap-2 border-b border-border pb-2 mt-2">
          {(["npm", "bun", "deno"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setInstallTab(r)}
              className={`px-3 py-1 text-xs font-semibold rounded ${
                installTab === r ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              {r === "npm" ? "npm" : r === "bun" ? "Bun" : "Deno"}
            </button>
          ))}
        </div>
        <div className="mt-2">
          {installTab === "npm" && <CodeBlock code="npm install @sujithx/authgate" className="text-primary" />}
          {installTab === "bun" && <CodeBlock code="bun add @sujithx/authgate" className="text-primary" />}
          {installTab === "deno" && <CodeBlock code="deno add npm:@sujithx/authgate" className="text-primary" />}
        </div>
        <p className="text-sm text-muted-foreground pt-4">
          Then, initialize the client once and use it everywhere. The SDK automatically attaches session cookies and infers TypeScript return types.
        </p>
      </div>

      {/* Runtime Tab Selector */}
      <div className="flex gap-2 border-b border-border pb-2 mt-6">
        {(["bun", "node", "deno"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setCodeTab(r)}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              codeTab === r ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
          >
            {r === "bun" ? "Bun" : r === "node" ? "Node.js (Express)" : "Deno (Oak)"}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {codeTab === "bun" && (
          <CodeBlock code={`import { AuthGateClient } from "@sujithx/authgate";

const auth = new AuthGateClient({
  baseUrl: "http://localhost:3005",
  credentials: "include",
});

// Native Bun HTTP listener
Bun.serve({
  port: 3000,
  async fetch(req) {
    const session = await auth.me();
    return new Response(\`Logged in as: \${session.data.user.email}\`);
  }
});`} />
        )}

        {codeTab === "node" && (
          <CodeBlock code={`const { AuthGateClient } = require("@sujithx/authgate");
const express = require("express");

const auth = new AuthGateClient({
  baseUrl: "http://localhost:3005",
  credentials: "include",
});

const app = express();

app.get("/me", async (req, res) => {
  try {
    const user = await auth.me();
    res.json({ email: user.data.user.email });
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.listen(3000);`} />
        )}

        {codeTab === "deno" && (
          <CodeBlock code={`import { AuthGateClient } from "npm:@sujithx/authgate";
import { Application } from "https://deno.land/x/oak/mod.ts";

const auth = new AuthGateClient({
  baseUrl: "http://localhost:3005",
  credentials: "include",
});

const app = new Application();

app.use(async (ctx) => {
  const user = await auth.me();
  ctx.response.body = \`Hello from Deno, \${user.data.user.email}!\`;
});

await app.listen({ port: 3000 });`} />
        )}
      </div>
    </div>
  );
}
