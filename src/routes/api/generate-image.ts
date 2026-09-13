import { createFileRoute } from "@tanstack/react-router";

/**
 * Bildgenerering för Social Creative Studio.
 *
 * Rutten är skyddad med samma ParkKey-identitet som resten av studion — inte
 * publik. LOVABLE_API_KEY lämnar aldrig servern. Svaret strömmas vidare precis
 * som det kommer från AI-gatewayen så att delbilder kan visas medan bilden byggs.
 */
export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { verifyParkkeyRequest } =
            await import("@/integrations/parkkey/verify-request.server");
          await verifyParkkeyRequest(request);
        } catch (error) {
          if (error instanceof Response) return error;
          return new Response("Behörigheten kunde inte verifieras.", { status: 503 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(
            "Bildgeneratorn är inte ansluten: ingen AI-nyckel i serverns miljö.",
            {
              status: 503,
            },
          );
        }

        let body: { prompt?: unknown; negative_prompt?: unknown; stream?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("Ogiltig förfrågan.", { status: 400 });
        }

        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
        if (prompt.length < 10) {
          return new Response("Bildprompten är för kort.", { status: 400 });
        }
        const negative =
          typeof body.negative_prompt === "string" && body.negative_prompt.trim()
            ? `\n\nUndvik helt: ${body.negative_prompt.trim()}`
            : "";
        const stream = body.stream !== false;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image",
            messages: [{ role: "user", content: `${prompt}${negative}` }],
            modalities: ["image", "text"],
            ...(stream ? { stream: true } : {}),
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Bildgenereringen misslyckades.", {
            status: upstream.status,
          });
        }

        if (!stream) {
          return new Response(upstream.body, {
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
