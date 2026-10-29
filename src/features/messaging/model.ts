import { createDemoId } from "../../lib/demo-id";
/** Local Hito 0 data. Selecting a perspective is not production authorization. */
export type ChatAudience = "business" | "customer";
export type ChatBusinessId = "photo" | "beauty" | "bakery" | "repairs";
export type Conversation = {
  id: string;
  businessId: ChatBusinessId;
  businessName: string;
  customerId: "alex" | "clara";
  customerName: string;
  subject: string;
};
export type DemoAttachment = {
  id: string;
  name: string;
  size: number;
  mime: string;
};
export type DemoMessage = {
  id: string;
  author: ChatAudience;
  text: string;
  createdAt: string;
  attachment?: DemoAttachment;
};
export type MessageStore = Record<string, DemoMessage[]>;
export const MESSAGE_STORAGE_KEY = "autonoservice-demo-messages-v1";
export const MESSAGE_EVENT = "autonoservice-demo-messages-change";
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_THREAD_MESSAGES = 100;
export const CONVERSATIONS: readonly Conversation[] = [
  {
    id: "lumen-alex",
    businessId: "photo",
    businessName: "Lumen Studio",
    customerId: "alex",
    customerName: "Alex López",
    subject: "Sesión de retrato",
  },
  {
    id: "lumen-clara",
    businessId: "photo",
    businessName: "Lumen Studio",
    customerId: "clara",
    customerName: "Clara Torres",
    subject: "Fotografía de producto",
  },
  {
    id: "barberia-alex",
    businessId: "beauty",
    businessName: "Barbería Norte",
    customerId: "alex",
    customerName: "Alex López",
    subject: "Consulta sobre un corte",
  },
  {
    id: "dulce-alex",
    businessId: "bakery",
    businessName: "Dulce Taller",
    customerId: "alex",
    customerName: "Alex López",
    subject: "Tarta para una celebración",
  },
  {
    id: "taller-alex",
    businessId: "repairs",
    businessName: "Taller Central",
    customerId: "alex",
    customerName: "Alex López",
    subject: "Revisión de equipo",
  },
];

const supportedFiles: Record<string, readonly string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  pdf: ["application/pdf"],
  txt: ["text/plain"],
  zip: ["application/zip", "application/x-zip-compressed"],
};
const localAttachmentUrls = new Map<string, string>();
const own = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

export function isChatBusinessId(value: unknown): value is ChatBusinessId {
  return (
    typeof value === "string" &&
    ["photo", "beauty", "bakery", "repairs"].includes(value)
  );
}
export function conversationsForAudience(
  audience: ChatAudience,
  businessId: ChatBusinessId = "photo",
): Conversation[] {
  return CONVERSATIONS.filter((conversation) =>
    audience === "business"
      ? conversation.businessId === businessId
      : conversation.customerId === "alex",
  );
}
export function selectConversation(
  audience: ChatAudience,
  businessId: ChatBusinessId,
  id?: string,
): Conversation | undefined {
  const available = conversationsForAudience(audience, businessId);
  return (
    available.find((conversation) => conversation.id === id) ?? available[0]
  );
}
export function validateAttachment(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (
    !file.name.trim() ||
    file.name.length > 120 ||
    /[\x00-\x1f/\\]/.test(file.name)
  )
    return "El nombre del archivo no es válido. Usa un nombre de hasta 120 caracteres.";
  if (
    !Number.isInteger(file.size) ||
    file.size <= 0 ||
    file.size > MAX_ATTACHMENT_SIZE
  )
    return "El archivo debe ocupar entre 1 byte y 10 MB.";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    !own(supportedFiles, extension) ||
    !supportedFiles[extension].includes(file.type.toLowerCase())
  )
    return "Adjunta una imagen JPG, PNG o WebP, un PDF, un TXT o un ZIP con el tipo de archivo correspondiente.";
  return null;
}
function seedMessages(conversation: Conversation): DemoMessage[] {
  const service =
    conversation.businessId === "photo"
      ? "Aquí podremos comentar el trabajo y compartir los archivos de prueba."
      : "Aquí podemos comentar tu consulta y los detalles del servicio o producto.";
  return [
    {
      id: `${conversation.id}-intro`,
      author: "customer",
      text: "Hola, me gustaría conocer un poco más sobre vuestro trabajo.",
      createdAt: "2026-10-28T09:00:00.000Z",
    },
    {
      id: `${conversation.id}-welcome`,
      author: "business",
      text: service,
      createdAt: "2026-10-28T09:05:00.000Z",
    },
  ];
}
function normalizeAttachment(input: unknown): DemoAttachment | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return undefined;
  const raw = input as Record<string, unknown>;
  if (!["id", "name", "size", "mime"].every((key) => own(raw, key)))
    return undefined;
  if (
    typeof raw.id !== "string" ||
    !/^[a-z0-9-]{1,100}$/i.test(raw.id) ||
    typeof raw.name !== "string" ||
    typeof raw.size !== "number" ||
    typeof raw.mime !== "string"
  )
    return undefined;
  if (validateAttachment({ name: raw.name, size: raw.size, type: raw.mime }))
    return undefined;
  return { id: raw.id, name: raw.name, size: raw.size, mime: raw.mime };
}
function normalizeMessage(input: unknown): DemoMessage | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  if (!["id", "author", "text", "createdAt"].every((key) => own(raw, key)))
    return null;
  if (
    typeof raw.id !== "string" ||
    !/^[a-z0-9-]{1,100}$/i.test(raw.id) ||
    (raw.author !== "customer" && raw.author !== "business") ||
    typeof raw.text !== "string" ||
    typeof raw.createdAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T/.test(raw.createdAt) ||
    !Number.isFinite(Date.parse(raw.createdAt))
  )
    return null;
  const text = raw.text.trim().slice(0, MAX_MESSAGE_LENGTH);
  const attachment = own(raw, "attachment")
    ? normalizeAttachment(raw.attachment)
    : undefined;
  if (!text && !attachment) return null;
  return {
    id: raw.id,
    author: raw.author,
    text,
    createdAt: new Date(raw.createdAt).toISOString(),
    ...(attachment ? { attachment } : {}),
  };
}
export function normalizeMessageStore(input: unknown): MessageStore {
  const raw =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    CONVERSATIONS.map((conversation) => {
      const messages =
        own(raw, conversation.id) && Array.isArray(raw[conversation.id])
          ? (raw[conversation.id] as unknown[])
          : null;
      const normalized = messages
        ? messages
            .map(normalizeMessage)
            .filter((message): message is DemoMessage => message !== null)
            .slice(-MAX_THREAD_MESSAGES)
        : seedMessages(conversation);
      const unique = Array.from(
        new Map(normalized.map((message) => [message.id, message])).values(),
      );
      return [conversation.id, unique];
    }),
  );
}
export function loadMessages(): MessageStore {
  if (typeof window === "undefined") return normalizeMessageStore(null);
  try {
    const raw = window.localStorage.getItem(MESSAGE_STORAGE_KEY);
    return normalizeMessageStore(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizeMessageStore(null);
  }
}
export function saveMessages(store: MessageStore): boolean {
  if (typeof window === "undefined") return false;
  try {
    const normalized = normalizeMessageStore(store);
    window.localStorage.setItem(
      MESSAGE_STORAGE_KEY,
      JSON.stringify(normalized),
    );
    const retained = new Set(
      Object.values(normalized).flatMap((messages) =>
        messages.flatMap((message) =>
          message.attachment ? [message.attachment.id] : [],
        ),
      ),
    );
    for (const id of localAttachmentUrls.keys())
      if (!retained.has(id)) removeLocalAttachment(id);
    window.dispatchEvent(new Event(MESSAGE_EVENT));
    return true;
  } catch {
    return false;
  }
}
export function addLocalAttachment(file: File): DemoAttachment {
  const error = validateAttachment(file);
  if (error) throw new Error(error);
  const id = createDemoId();
  const url = URL.createObjectURL(file);
  localAttachmentUrls.set(id, url);
  return { id, name: file.name, size: file.size, mime: file.type };
}
export function getLocalAttachmentUrl(id: string): string | undefined {
  return localAttachmentUrls.get(id);
}
export function removeLocalAttachment(id: string): void {
  const url = localAttachmentUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  localAttachmentUrls.delete(id);
}
export function appendMessage(
  conversationId: string,
  author: ChatAudience,
  text: string,
  attachment?: DemoAttachment,
): { ok: true; store: MessageStore } | { ok: false; error: string } {
  if (!CONVERSATIONS.some((conversation) => conversation.id === conversationId))
    return { ok: false, error: "No encontramos esa conversación de ejemplo." };
  if (author !== "customer" && author !== "business")
    return { ok: false, error: "La perspectiva de demostración no es válida." };
  const trimmed = text.trim();
  if (trimmed.length > MAX_MESSAGE_LENGTH)
    return {
      ok: false,
      error: "El mensaje puede tener como máximo 2.000 caracteres.",
    };
  const validAttachment = normalizeAttachment(attachment);
  if (attachment && !validAttachment)
    return { ok: false, error: "El archivo adjunto no es válido." };
  if (!trimmed && !validAttachment)
    return {
      ok: false,
      error: "Escribe un mensaje o adjunta un archivo de prueba.",
    };
  const store = loadMessages();
  const message: DemoMessage = {
    id: createDemoId(),
    author,
    text: trimmed,
    createdAt: new Date().toISOString(),
    ...(validAttachment ? { attachment: validAttachment } : {}),
  };
  const updated = {
    ...store,
    [conversationId]: [...store[conversationId], message].slice(
      -MAX_THREAD_MESSAGES,
    ),
  };
  if (!saveMessages(updated))
    return {
      ok: false,
      error:
        "No se ha podido guardar el mensaje. El navegador no permite usar el almacenamiento local o está lleno.",
    };
  return { ok: true, store: updated };
}
