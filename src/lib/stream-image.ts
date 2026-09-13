import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";

import { parkkeyAuth } from "@/integrations/parkkey/auth-client";

type ImageEventPayload =
  | { type: "image_generation.partial_image"; b64_json: string; partial_image_index: number }
  | { type: "image_generation.completed"; b64_json: string }
  | { type: "error"; error: { message: string } };

async function authHeaders() {
  const { data } = await parkkeyAuth.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Din session har gått ut. Logga in igen.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Strömmar en genererad bild från studions skyddade genereringsrutt.
 * onFrame anropas för varje delbild och sist för den färdiga bilden.
 */
export async function streamGeneratedImage(
  prompt: string,
  negativePrompt: string | null,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
): Promise<string> {
  const headers = await authHeaders();
  const payload = { prompt, negative_prompt: negativePrompt ?? undefined };

  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...payload, stream: true }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Bildgenereringen misslyckades (${res.status}).`);
  }

  let finalDataUrl: string | null = null;
  let sawAnyEvent = false;
  let streamError: string | undefined;

  const parser = createParser({
    onEvent(event) {
      let parsed: ImageEventPayload | undefined;
      try {
        parsed = JSON.parse(event.data) as ImageEventPayload;
      } catch {
        return;
      }
      if (event.event === "error" || parsed?.type === "error") {
        sawAnyEvent = true;
        streamError =
          (parsed as { error?: { message?: string } })?.error?.message ??
          "Bildgenereringen misslyckades.";
        return;
      }
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed"
      ) {
        return;
      }
      const b64 = (parsed as { b64_json?: string }).b64_json;
      if (!b64) return;
      sawAnyEvent = true;
      const isFinal = event.event === "image_generation.completed";
      const dataUrl = `data:image/png;base64,${b64}`;
      if (isFinal) finalDataUrl = dataUrl;
      flushSync(() => onFrame(dataUrl, isFinal));
    },
  });

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    void reader.cancel().catch(() => {});
  }

  if (streamError) throw new Error(streamError);

  if (!sawAnyEvent) {
    // Noll händelser = transporthicka. Spela om en gång utan strömning.
    const replay = await fetch("/api/generate-image", {
      method: "POST",
      headers,
      body: JSON.stringify({ ...payload, stream: false }),
    });
    if (!replay.ok) {
      const text = await replay.text().catch(() => "");
      throw new Error(text || `Bildgenereringen misslyckades (${replay.status}).`);
    }
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Bildgenereringen gav ingen bild.");
    const dataUrl = `data:image/png;base64,${b64}`;
    onFrame(dataUrl, true);
    return dataUrl;
  }

  if (!finalDataUrl) throw new Error("Bildströmmen avbröts innan bilden blev klar.");
  return finalDataUrl;
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: "image/png" });
}
