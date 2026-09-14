type ReplicateAccount = {
  type?: string;
  username?: string;
  name?: string;
};

export type ReplicateRuntimeReadiness = {
  configured: boolean;
  model: string;
  allowedHostsConfigured: boolean;
  note: string;
};

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function configuredAllowedHosts(): string[] {
  return (env("VIDEO_RENDER_ALLOWED_HOSTS") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function getReplicateRuntimeReadiness(): ReplicateRuntimeReadiness {
  const token = env("REPLICATE_API_TOKEN");
  const model = env("REPLICATE_VIDEO_MODEL") ?? "google/veo-2";
  const allowlist = configuredAllowedHosts();
  const allowedHostsConfigured =
    allowlist.includes("replicate.delivery") && allowlist.includes("*.replicate.delivery");

  return {
    configured: Boolean(token && allowedHostsConfigured),
    model,
    allowedHostsConfigured,
    note: !token
      ? "REPLICATE_API_TOKEN saknas i produktionsmiljön."
      : !allowedHostsConfigured
        ? "Replicate-token finns, men VIDEO_RENDER_ALLOWED_HOSTS saknar replicate.delivery och *.replicate.delivery."
        : `Replicate-runtime är konfigurerad med modell ${model}; provider-kontot måste fortfarande verifieras live innan CONNECTED.`,
  };
}

export async function verifyReplicateAccount(): Promise<{
  ok: boolean;
  account: ReplicateAccount | null;
  status: number;
  note: string;
}> {
  const token = env("REPLICATE_API_TOKEN");
  if (!token) {
    return {
      ok: false,
      account: null,
      status: 0,
      note: "REPLICATE_API_TOKEN saknas i produktionsmiljön.",
    };
  }

  let response: Response;
  try {
    response = await fetch("https://api.replicate.com/v1/account", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    return {
      ok: false,
      account: null,
      status: 0,
      note: `Replicate kunde inte nås: ${error instanceof Error ? error.message : "okänt fel"}`,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      account: null,
      status: response.status,
      note: `Replicate-kontot kunde inte verifieras (HTTP ${response.status}).`,
    };
  }

  const account = (await response.json().catch(() => null)) as ReplicateAccount | null;
  const identity = account?.name || account?.username || "verifierat konto";
  return {
    ok: true,
    account,
    status: response.status,
    note: `Replicate-kontot ${identity} verifierades live via /v1/account.`,
  };
}
