import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PromptDocCard({
  title,
  content,
  filenameBase,
  description,
}: {
  title: string;
  content: string;
  filenameBase: string;
  description?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(`${title} kopierad`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunde inte kopiera. Markera texten och kopiera manuellt.");
    }
  }

  function download() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="surface-glass rounded-xl">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
          {title}
        </h3>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "Kopierad" : "Kopiera"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={download}>
            <Download aria-hidden="true" />
            Ladda ner
          </Button>
        </div>
      </header>
      <pre className="max-h-[26rem] overflow-auto px-4 py-4 text-[12.5px] leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
        {content}
      </pre>
    </section>
  );
}
