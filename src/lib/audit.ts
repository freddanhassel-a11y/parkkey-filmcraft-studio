export type AuditAction =
  | "media.upload"
  | "media.version"
  | "media.update"
  | "media.archive"
  | "media.preview"
  | "coreos.context.import"
  | "coreos.material.export"
  | "coreos.link"
  | "social.create"
  | "social.update"
  | "social.status"
  | "social.schedule"
  | "social.publish.blocked"
  | "social.publish.attempt"
  | "social.publish.success"
  | "social.publish.failed"
  | "delivery.package.create"
  | "delivery.package.confirm"
  | "render.master.register"
  | "render.provider.check";

type AuditClient = {
  from: (table: "audit_events") => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

/** Spårlogg för allt material som importeras, länkas, delas, schemaläggs eller skickas. */
export async function logAudit(
  db: unknown,
  actor: { userId: string; email: string | null },
  action: AuditAction,
  entity: { type: string; id?: string | null },
  detail: Record<string, unknown> = {},
): Promise<void> {
  const client = db as AuditClient;
  const { error } = await client.from("audit_events").insert({
    actor_user_id: actor.userId,
    actor_email: actor.email,
    action,
    entity_type: entity.type,
    entity_id: entity.id ?? null,
    detail,
  });
  if (error) console.error("[audit] kunde inte skriva spårlogg", error.message);
}
