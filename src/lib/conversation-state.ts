/** Shared conversation rules: no DOM or provider SDK is required. */
export type ConversationContext = "customer" | "business";
export type ConversationIdentity = {
  id: string;
  organization_id: string;
  customer_id: string;
};
export type MessageIdentity = { id: string; created_at: string };

export const MESSAGE_PAGE_SIZE = 200;

export function conversationKey(
  thread: ConversationIdentity,
  role: ConversationContext,
): string {
  return role === "customer" ? `organization:${thread.organization_id}` : `thread:${thread.id}`;
}

export function contextConversations<T extends ConversationIdentity>(
  threads: T[],
  role: ConversationContext,
  userId: string,
  ownedOrganizationIds: readonly string[],
): T[] {
  const owned = new Set(ownedOrganizationIds);
  return threads.filter((thread) => role === "business"
    ? owned.has(thread.organization_id)
    : thread.customer_id === userId);
}

function compareMessages(a: MessageIdentity, b: MessageIdentity): number {
  const difference = Date.parse(a.created_at) - Date.parse(b.created_at);
  // PostgreSQL preserves microseconds. Keep their order when JS rounds to ms,
  // including equivalent UTC and numeric-offset timestamp representations.
  const remainder = (value: string) => Number((value.match(/\.(\d+)/)?.[1] || "").padEnd(6, "0").slice(3, 6));
  return difference || remainder(a.created_at) - remainder(b.created_at) || a.id.localeCompare(b.id);
}

export function chronologicalMessages<T extends MessageIdentity>(messages: T[]): T[] {
  return [...new Map(messages.map((message) => [message.id, message])).values()]
    .sort(compareMessages);
}

export function mergeLatestMessages<T extends MessageIdentity>(
  previous: T[],
  latest: T[],
): { messages: T[]; contiguous: boolean } {
  const known = new Set(previous.map((message) => message.id));
  const contiguous = previous.length === 0 || latest.some((message) => known.has(message.id));
  // A long polling gap can exceed a page. Start at the latest page again so
  // loading history can fill the gap instead of silently skipping its messages.
  return {
    messages: chronologicalMessages(contiguous ? [...previous, ...latest] : latest),
    contiguous,
  };
}

export function latestReadCursor(messages: readonly MessageIdentity[]): string | null {
  const valid = messages.filter((message) => Number.isFinite(Date.parse(message.created_at)));
  return valid.length ? [...valid].sort(compareMessages).at(-1)!.created_at : null;
}

export function laterReadCursor(previous: string | undefined, candidate: string): string {
  return previous && compareMessages({ id: "", created_at: previous }, { id: "", created_at: candidate }) > 0
    ? previous : candidate;
}

export function olderMessagesFilter(cursor: MessageIdentity): string {
  // These values originate in PostgreSQL, but validate before placing them in
  // PostgREST's filter grammar; preserve its original microsecond precision.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor.id)
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(cursor.created_at)
    || !Number.isFinite(Date.parse(cursor.created_at))) {
    throw new Error("No se pudo identificar el punto del historial. Actualiza la conversación.");
  }
  return `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
}
