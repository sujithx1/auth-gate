import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

export function SetupDoc() {
  const [codeTab, setCodeTab] = useState<"bun" | "node" | "deno">("bun");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Getting Started</h2>
      <p className="text-sm text-muted-foreground">
        Install the client SDK inside your application workspace to initialize your connection context:
      </p>
      <CodeBlock code="npm install @sujithx/authgate" className="text-primary" />

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
