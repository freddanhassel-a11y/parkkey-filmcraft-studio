import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { publishConfirmedLinkedInPost } from "@/lib/linkedin-publish.functions";
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
  const [confirmed, setConfirmed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const eligible = props.status === "APPROVED" || props.status.startsWith("SCHEDULED");
  const mediaBlocked = props.attachedCount > 0;

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
          <p className="text-sm font-semibold">Extern LinkedIn-publicering</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {mediaBlocked
              ? "Det här inlägget har media. Film Studio vägrar publicera en text-only-variant tills LinkedIn-mediauppladdningen är verifierad."
              : "Detta är en verklig extern åtgärd. Servern kräver verifierad CoreOS-kapacitet, server-side LinkedIn-token och LinkedIns riktiga post-URN innan status kan bli PUBLISHED."}
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

      <Button
        className="mt-3"
        disabled={!eligible || mediaBlocked || !confirmed || publishing}
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
                  error instanceof Error ? error.message : "LinkedIn-publiceringen misslyckades.",
                ),
            )
            .finally(() => setPublishing(false));
        }}
      >
        <Send aria-hidden="true" />
        {publishing ? "Publicerar…" : "Publicera på LinkedIn nu"}
      </Button>

      {!eligible ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Inlägget måste vara APPROVED eller ligga i en verifierad schemakö först.
        </p>
      ) : null}
    </div>
  );
}
