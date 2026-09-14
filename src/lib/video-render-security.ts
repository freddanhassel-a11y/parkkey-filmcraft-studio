const MAX_REDIRECTS = 3;

type Ipv4Tuple = [number, number, number, number];

function normalizedHostname(value: string): string {
  return value.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
}

function parseIpv4(hostname: string): Ipv4Tuple | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
  return [octets[0]!, octets[1]!, octets[2]!, octets[3]!];
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = parseIpv4(hostname);
  if (!octets) return false;
  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (!host.includes(":")) return false;
  return (
    host === "::" ||
    host === "::1" ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    /^fe[89ab]/.test(host) ||
    host.startsWith("2001:db8:") ||
    host.startsWith("::ffff:127.") ||
    host.startsWith("::ffff:10.") ||
    host.startsWith("::ffff:169.254.") ||
    host.startsWith("::ffff:192.168.")
  );
}

function isBlockedHostname(hostname: string): boolean {
  const host = normalizedHostname(hostname);
  return (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".home.arpa") ||
    isPrivateIpv4(host) ||
    isPrivateIpv6(host)
  );
}

function allowedRenderHosts(): string[] {
  return (process.env["VIDEO_RENDER_ALLOWED_HOSTS"] ?? "")
    .split(",")
    .map((host) => normalizedHostname(host))
    .filter(Boolean);
}

function hostMatchesRule(hostname: string, rule: string): boolean {
  if (rule.startsWith("*.")) {
    const suffix = rule.slice(1);
    return hostname.endsWith(suffix) && hostname.length > suffix.length;
  }
  return hostname === rule;
}

export function assertSafeRenderUrl(url: URL): void {
  if (url.protocol !== "https:") throw new Error("Renderfilen måste använda HTTPS.");
  if (url.username || url.password)
    throw new Error("Render-URL får inte innehålla inloggningsuppgifter.");
  if (url.port && url.port !== "443") throw new Error("Render-URL måste använda standardport 443.");

  const hostname = normalizedHostname(url.hostname);
  if (isBlockedHostname(hostname)) {
    throw new Error(
      "Render-URL pekar mot ett lokalt eller privat nät och blockeras av säkerhetsskäl.",
    );
  }

  const allowlist = allowedRenderHosts();
  if (allowlist.length === 0) {
    throw new Error(
      "VIDEO_RENDER_ALLOWED_HOSTS saknas i produktionsmiljön. Externa renderfiler blockeras fail-closed.",
    );
  }
  if (!allowlist.some((rule) => hostMatchesRule(hostname, rule))) {
    throw new Error(`Render-host ${hostname} finns inte i serverns tillåtna hostlista.`);
  }
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

async function probe(url: URL, method: "HEAD" | "GET"): Promise<Response> {
  if (method === "GET") {
    return fetch(url, { method, headers: { Range: "bytes=0-0" }, redirect: "manual" });
  }
  return fetch(url, { method, redirect: "manual" });
}

export async function verifyExternalMp4(
  initialUrl: URL,
): Promise<{ finalUrl: URL; contentType: string }> {
  let current = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    assertSafeRenderUrl(current);

    let response: Response;
    try {
      response = await probe(current, "HEAD");
      if (response.status === 405 || response.status === 501) {
        await response.body?.cancel().catch(() => undefined);
        response = await probe(current, "GET");
      }
    } catch (error) {
      throw new Error(
        `Renderfilen kunde inte verifieras: ${error instanceof Error ? error.message : "okänt fel"}`,
      );
    }

    if (isRedirect(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel().catch(() => undefined);
      if (!location)
        throw new Error("Renderleverantören returnerade en redirect utan Location-header.");
      if (redirectCount === MAX_REDIRECTS) throw new Error("Renderfilen har för många redirects.");
      current = new URL(location, current);
      continue;
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    await response.body?.cancel().catch(() => undefined);

    if (!response.ok) throw new Error(`Renderfilen svarade med HTTP ${response.status}.`);
    if (!contentType.includes("video/mp4")) {
      throw new Error(
        `Renderfilen måste verifieras som video/mp4 av leverantören; mottaget content-type: ${contentType || "saknas"}.`,
      );
    }

    return { finalUrl: current, contentType };
  }

  throw new Error("Renderfilen kunde inte verifieras säkert.");
}
