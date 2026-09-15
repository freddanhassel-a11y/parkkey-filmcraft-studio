import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, ExternalLink, Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import {
  prepareLinkedInManualHandoff,
  publishConfirmedLinkedInPost,
} from "@/lib/linkedin-publish.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function LinkedInPublishGate(props: {
  postId: string;
  status: string;
  attachedCount: number;
  onResult: () => void;
}) {
  const publish = useServerFn(publishConfirmedLinkedInPost);
  const prepareManual = useServerFn(prepareLinkedInManualHandoff);
  const [confirmed, setConfirmed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const eligible = props.status === "APPROVED" || props.status.startsWith("SCHEDULED");
  const mediaBlocked = props.attachedCount > 0;

  const runManualHandoff = () => {
    if (!eligible || manualBusy) return;
    setManualBusy(true);
    void prepareManual({ data: { post_id: props.postId, language: "sv" } })
      .then(async (result) => {
        try {
          await navigator.clipboard.writeText(result.copy);
          toast.success("LinkedIn-texten kopierades.");
        } catch {
          toast.warning("Kunde inte kopiera automatiskt. Öppnar LinkedIn ändå.");
        }
        window.open(result.composerUrl, "_blank", "noopener,noreferrer");
        toast.success("LinkedIn öppnades. Klistra in texten och bifoga media vid behov.");
        props.onResult();
      })
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Kunde inte förbereda LinkedIn-handoff.",
        ),
      )
      .finally(() => setManualBusy(false));
  };

  return (
    <div className="w-full rounded-lg border border-border bg-background/45 p-3">
      <div className="flex items-start gap-2">
        {mediaBlocked ? (
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-status-unknown"
          />
        ) : (
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">LinkedIn-publicering</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {mediaBlocked
              ? "Direct API-publicering är blockerad för media tills LinkedIn-mediauppladdningen är verifierad. Den manuella genvägen fungerar ändå: Film Studio kopierar texten, öppnar LinkedIn och låter dig bifoga media där."
              : "Först provas verifierad direct API-publicering. Om server-token saknas kan du använda den säkra manuella genvägen nedan utan att Film Studio fejkar PUBLISHED-status."}
          </p>
        </div>
      </div>

      {!mediaBlocked ? (
        <div className="mt-3 flex items-start gap-2">
          <Checkbox
            id={`confirm-linkedin-${props.postId}`}
            checked={confirmed}
            disabled={!eligible || publishing}
            onCheckedChange={(value) => setConfirmed(value === true)}
          />
          <Label
            htmlFor={`confirm-linkedin-${props.postId}`}
            className="text-xs font-normal leading-relaxed"
          >
            Jag bekräftar att detta godkända inlägg ska publiceras externt på den verifierade
            LinkedIn-identiteten nu.
          </Label>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!mediaBlocked ? (
          <Button
            disabled={!eligible || !confirmed || publishing}
            onClick={() => {
              setPublishing(true);
              void publish({
                data: {
                  post_id: props.postId,
                  confirmed: true,
                  language: "sv",
                },
              })
                .then(
                  (result) => {
                    if (result.published) toast.success(result.message);
                    else toast.error(result.message);
                    setConfirmed(false);
                    props.onResult();
                  },
                  (error: unknown) =>
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "LinkedIn-publiceringen misslyckades.",
                    ),
                )
                .finally(() => setPublishing(false));
            }}
          >
            <Send aria-hidden="true" />
            {publishing ? "Publicerar…" : "Publicera via API"}
          </Button>
        ) : null}

        <Button variant="outline" disabled={!eligible || manualBusy} onClick={runManualHandoff}>
          <Copy aria-hidden="true" />
          {manualBusy ? "Förbereder…" : "Kopiera + öppna LinkedIn"}
          <ExternalLink aria-hidden="true" />
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Den manuella vägen loggas som MANUAL HANDOFF — READY och ändrar aldrig status till PUBLISHED
        utan ett verifierat LinkedIn-resultat.
      </p>

      {!eligible ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Inlägget måste vara APPROVED eller ligga i en verifierad schemakö först.
        </p>
      ) : null}
    </div>
  );
}
