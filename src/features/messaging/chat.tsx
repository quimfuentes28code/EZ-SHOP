"use client";

import Link from "next/link";
import { setDemoExperience } from "@/lib/experience";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  addLocalAttachment,
  appendMessage,
  conversationsForAudience,
  getLocalAttachmentUrl,
  loadMessages,
  MAX_MESSAGE_LENGTH,
  MESSAGE_EVENT,
  MESSAGE_STORAGE_KEY,
  normalizeMessageStore,
  removeLocalAttachment,
  selectConversation,
  validateAttachment,
  type ChatAudience,
  type ChatBusinessId,
  type DemoAttachment,
  type MessageStore,
} from "./model";
import "./chat.css";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.slice(0, 1))
    .slice(0, 2)
    .join("");
const fileSize = (size: number) =>
  size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
const searchText = (value: string) =>
  value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function ChatDemo({
  audience,
  businessId = "photo",
  initialConversationId,
}: {
  audience: ChatAudience;
  businessId?: ChatBusinessId;
  initialConversationId?: string;
}) {
  const available = conversationsForAudience(audience, businessId);
  useEffect(() => {
    setDemoExperience(audience);
  }, [audience]);
  const initial = selectConversation(
    audience,
    businessId,
    initialConversationId,
  );
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [showThread, setShowThread] = useState(Boolean(initialConversationId));
  const [store, setStore] = useState<MessageStore>(() =>
    normalizeMessageStore(null),
  );
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const conversation =
    available.find((item) => item.id === selectedId) ?? initial;
  const messages = conversation ? (store[conversation.id] ?? []) : [];
  useEffect(() => {
    const refresh = () => setStore(loadMessages());
    refresh();
    window.addEventListener(MESSAGE_EVENT, refresh);
    const storage = (event: StorageEvent) => {
      if (event.key === MESSAGE_STORAGE_KEY || event.key === null) refresh();
    };
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(MESSAGE_EVENT, refresh);
      window.removeEventListener("storage", storage);
    };
  }, []);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [selectedId, messages.length]);
  const choose = (id: string) => {
    setSelectedId(id);
    setShowThread(true);
    setDraft("");
    setFile(null);
    setError("");
    setStatus("");
    requestAnimationFrame(() => heading.current?.focus());
  };
  const selectFile = (candidate?: File) => {
    setError("");
    setStatus("");
    if (!candidate) return;
    const invalid = validateAttachment(candidate);
    if (invalid) {
      setError(invalid);
      return;
    }
    setFile(candidate);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");
    if (!conversation) return;
    let attachment: DemoAttachment | undefined;
    try {
      if (file) attachment = addLocalAttachment(file);
      const result = appendMessage(
        conversation.id,
        audience,
        draft,
        attachment,
      );
      if (!result.ok) {
        if (attachment) removeLocalAttachment(attachment.id);
        setError(result.error);
        return;
      }
      setStore(result.store);
      setDraft("");
      setFile(null);
      setStatus(
        "Mensaje guardado en este navegador. No se ha enviado a otra persona.",
      );
    } catch (caught) {
      if (attachment) removeLocalAttachment(attachment.id);
      setError(
        caught instanceof Error
          ? caught.message
          : "No hemos podido preparar ese archivo de prueba.",
      );
    }
  };
  const filtered = available.filter((item) =>
    searchText(
      `${item.businessName} ${item.customerName} ${item.subject}`,
    ).includes(searchText(query.trim())),
  );
  const counterparty = conversation
    ? audience === "business"
      ? conversation.customerName
      : conversation.businessName
    : "Conversación";
  const otherAudience = audience === "business" ? "cliente" : "empresa";

  return (
    <div className="container as-messaging">
      <div className="as-messaging-top">
        <Link
          className="inline-link"
          href={audience === "business" ? "/demo/empresa" : "/demo/cliente"}
        >
          <ArrowLeft size={15} />
          Volver a {audience === "business" ? "mi negocio" : "Cliente"}
        </Link>
        <span className="tag">
          Perspectiva {audience === "business" ? "Mi negocio" : "Cliente"} ·
          Demo local
        </span>
      </div>
      <div className="as-messaging-title">
        <div>
          <span className="eyebrow">CONVERSACIONES Y ARCHIVOS</span>
          <h1>Mensajes</h1>
          <p>Habla del trabajo y comparte archivos en el mismo lugar.</p>
        </div>
        <span className="as-chat-private">
          <ShieldCheck size={17} />
          Sin envíos reales
        </span>
      </div>
      <div className={`as-chat ${showThread ? "has-thread" : ""}`}>
        <aside
          className="as-chat-sidebar"
          aria-label="Conversaciones de demostración"
        >
          <div className="as-chat-sidebar-title">
            <h2>Conversaciones</h2>
            <span>{available.length}</span>
          </div>
          <label className="as-chat-search">
            <Search size={16} />
            <input
              type="search"
              aria-label="Buscar conversaciones"
              placeholder="Busca una conversación"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="as-chat-conversations">
            {filtered.length ? (
              filtered.map((item) => {
                const name =
                  audience === "business"
                    ? item.customerName
                    : item.businessName;
                const latest = store[item.id]?.at(-1);
                return (
                  <button
                    className={`as-chat-conversation ${conversation?.id === item.id ? "is-selected" : ""}`}
                    key={item.id}
                    aria-label={`Conversación con ${name}`}
                    aria-pressed={conversation?.id === item.id}
                    onClick={() => choose(item.id)}
                  >
                    <span className="as-chat-avatar">{initials(name)}</span>
                    <span>
                      <strong>{name}</strong>
                      <small>{item.subject}</small>
                      <p>
                        {latest?.text ||
                          latest?.attachment?.name ||
                          "Empieza con un mensaje de ejemplo"}
                      </p>
                    </span>
                    <ArrowRight size={13} />
                  </button>
                );
              })
            ) : (
              <div className="as-chat-empty">
                <Search size={23} />
                <h3>No hay coincidencias</h3>
                <p>Prueba con otro nombre o servicio.</p>
                <button className="inline-link" onClick={() => setQuery("")}>
                  Restablecer búsqueda
                </button>
              </div>
            )}
          </div>
          <div className="as-chat-sidebar-note">
            <ShieldCheck size={15} />
            <p>
              Las perspectivas permiten revisar la demo. No verifican una
              identidad ni permisos reales.
            </p>
          </div>
        </aside>
        <section
          className="as-chat-thread"
          aria-label="Conversación seleccionada"
        >
          {conversation ? (
            <>
              <header className="as-chat-thread-header">
                <button
                  className="icon-button as-chat-back"
                  aria-label="Volver a conversaciones"
                  onClick={() => {
                    setShowThread(false);
                    requestAnimationFrame(() =>
                      document
                        .querySelector<HTMLInputElement>(
                          ".as-chat-search input",
                        )
                        ?.focus(),
                    );
                  }}
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="as-chat-avatar">{initials(counterparty)}</span>
                <div>
                  <h2 ref={heading} tabIndex={-1}>
                    {counterparty}
                  </h2>
                  <p>{conversation.subject} · Ejemplo</p>
                </div>
                {audience === "customer" && (
                  <Link
                    href={`/negocio/${conversation.businessId}`}
                    className="as-chat-business-link"
                  >
                    Ver negocio <ArrowUpRight size={14} />
                  </Link>
                )}
              </header>
              <div className="as-chat-session-note">
                <ShieldCheck size={13} />
                <span>
                  Los mensajes se guardan sólo aquí. Los archivos están
                  disponibles durante esta sesión.
                </span>
              </div>
              <div
                className="as-chat-log"
                ref={log}
                role="log"
                aria-label="Mensajes de la conversación"
                aria-live="polite"
                aria-relevant="additions"
              >
                <p className="as-chat-log-intro">
                  Conversación ficticia · AutonoService
                </p>
                {messages.map((message) => {
                  const ownMessage = message.author === audience;
                  const url = message.attachment
                    ? getLocalAttachmentUrl(message.attachment.id)
                    : undefined;
                  return (
                    <article
                      key={message.id}
                      className={`as-chat-message ${ownMessage ? "is-own" : ""}`}
                    >
                      <span className="as-chat-message-author">
                        {ownMessage
                          ? "Tú"
                          : message.author === "business"
                            ? conversation.businessName
                            : conversation.customerName}
                      </span>
                      {message.text && <p>{message.text}</p>}
                      {message.attachment && (
                        <div className="as-chat-attachment">
                          <span className="as-chat-file-icon">
                            {message.attachment.mime.startsWith("image/") ? (
                              <ImageIcon size={21} />
                            ) : (
                              <FileText size={21} />
                            )}
                          </span>
                          <div>
                            <strong>{message.attachment.name}</strong>
                            <small>
                              {fileSize(message.attachment.size)} · Copia local
                            </small>
                            {url ? (
                              <a
                                href={url}
                                download={message.attachment.name}
                                aria-label={`Descargar ${message.attachment.name}`}
                              >
                                <Download size={13} />
                                Descargar copia local
                              </a>
                            ) : (
                              <span className="as-chat-expired">
                                Archivo de otra sesión. Vuelve a adjuntarlo.
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <small className="as-chat-message-time">
                        {new Intl.DateTimeFormat("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Madrid",
                        }).format(new Date(message.createdAt))}
                        <span>Guardado local</span>
                      </small>
                    </article>
                  );
                })}
              </div>
              <form className="as-chat-composer" onSubmit={submit}>
                <label className="sr-only" htmlFor="as-chat-message">
                  Mensaje de ejemplo
                </label>
                <textarea
                  id="as-chat-message"
                  placeholder="Escribe un mensaje de prueba…"
                  maxLength={MAX_MESSAGE_LENGTH}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError("");
                    setStatus("");
                  }}
                  rows={2}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                {file && (
                  <div className="as-chat-pending-file">
                    <Paperclip size={14} />
                    <span>
                      {file.name} · {fileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Quitar archivo adjunto"
                      onClick={() => setFile(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="as-chat-compose-actions">
                  <input
                    ref={input}
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.zip"
                    aria-label="Archivo de prueba"
                    onChange={(event) => {
                      selectFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <button
                    className="button secondary small"
                    type="button"
                    onClick={() => input.current?.click()}
                  >
                    <Paperclip size={15} />
                    Adjuntar archivo de prueba
                  </button>
                  <span>
                    {draft.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                  <button
                    className="button primary small"
                    type="submit"
                    disabled={!draft.trim() && !file}
                  >
                    <Send size={14} />
                    Guardar mensaje
                  </button>
                </div>
                <p className="as-chat-file-guidance">
                  JPG, PNG, WebP, PDF, TXT o ZIP · Hasta 10 MB · Sólo archivos
                  de prueba.
                </p>
                {error && (
                  <p className="as-chat-error" role="alert">
                    {error}
                  </p>
                )}
                <p className="as-chat-status" role="status">
                  {status}
                </p>
              </form>
            </>
          ) : (
            <div className="as-chat-empty">
              <MessageCircle size={30} />
              <h2>Abre una conversación</h2>
              <p>Aquí aparecerán los mensajes de demostración.</p>
            </div>
          )}
        </section>
      </div>
      {conversation && (
        <div className="as-chat-perspective">
          <p>
            <ShieldCheck size={15} />
            No hay cuentas reales, archivos subidos ni confirmaciones de
            recepción.
          </p>
          <Link
            className="inline-link"
            href={`/mensajes?como=${otherAudience}&negocio=${conversation.businessId}&conversacion=${conversation.id}`}
          >
            Revisar perspectiva{" "}
            {audience === "business" ? "Cliente" : "Mi negocio"}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
