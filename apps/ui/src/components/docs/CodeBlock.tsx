import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-2">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-card/80 text-muted-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card hover:text-foreground z-10"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className={`p-4 bg-muted rounded-lg border border-border text-xs overflow-x-auto font-mono ${className || "text-foreground"}`}>
        {code}
      </pre>
    </div>
  );
}
