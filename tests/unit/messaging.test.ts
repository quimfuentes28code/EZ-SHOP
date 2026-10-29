import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendMessage,
  CONVERSATIONS,
  conversationsForAudience,
  loadMessages,
  MAX_ATTACHMENT_SIZE,
  MAX_MESSAGE_LENGTH,
  MAX_THREAD_MESSAGES,
  MESSAGE_EVENT,
  MESSAGE_STORAGE_KEY,
  normalizeMessageStore,
  saveMessages,
  selectConversation,
  validateAttachment,
} from "../../src/features/messaging/model";

function withStorage<T>(
  run: (store: Map<string, string>, events: string[]) => T,
  blocked = false,
): T {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const store = new Map<string, string>();
  const events: string[] = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          if (blocked) throw new Error("blocked");
          store.set(key, value);
        },
      },
      dispatchEvent: (event: Event) => {
        events.push(event.type);
        return true;
      },
    },
  });
  try {
    return run(store, events);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
}

test("las perspectivas sólo seleccionan sus conversaciones de muestra", () => {
  assert.equal(conversationsForAudience("business", "photo").length, 2);
  assert.deepEqual(
    conversationsForAudience("business", "bakery").map((item) => item.id),
    ["dulce-alex"],
  );
  assert.ok(
    conversationsForAudience("customer").every(
      (item) => item.customerId === "alex",
    ),
  );
  assert.ok(
    !conversationsForAudience("customer").some(
      (item) => item.id === "lumen-clara",
    ),
  );
  assert.equal(
    selectConversation("customer", "photo", "lumen-clara")?.id,
    "lumen-alex",
  );
  assert.equal(
    selectConversation("business", "bakery", "lumen-alex")?.id,
    "dulce-alex",
  );
});

test("los adjuntos deben tener extensión y MIME compatibles y como máximo 10 MB", () => {
  for (const file of [
    { name: "imagen.jpg", type: "image/jpeg", size: 200 },
    { name: "entrega.PDF", type: "application/pdf", size: MAX_ATTACHMENT_SIZE },
    { name: "notas.txt", type: "text/plain", size: 1 },
    { name: "entrega.zip", type: "application/x-zip-compressed", size: 200 },
  ])
    assert.equal(validateAttachment(file), null);
  for (const file of [
    { name: "x.svg", type: "image/svg+xml", size: 100 },
    { name: "imagen.png", type: "text/html", size: 100 },
    { name: "imagen.png.exe", type: "image/png", size: 100 },
    { name: "../notas.txt", type: "text/plain", size: 100 },
    { name: "x.txt", type: "text/plain", size: 0 },
    { name: "x.txt", type: "text/plain", size: MAX_ATTACHMENT_SIZE + 1 },
    { name: "constructor", type: "text/plain", size: 100 },
  ])
    assert.equal(typeof validateAttachment(file), "string");
});

test("la carga normaliza mensajes y nunca conserva URLs ni campos arbitrarios", () => {
  const raw = {
    id: "mensaje-1",
    author: "business",
    text: " Hola ",
    createdAt: "2026-10-28T12:00:00Z",
    attachment: {
      id: "file-1",
      name: "archivo.txt",
      size: 3,
      mime: "text/plain",
      url: "https://external.invalid/file",
    },
    injected: true,
  };
  const state = normalizeMessageStore({
    "lumen-alex": [raw, raw, { ...raw, id: "bad", author: "administrator" }],
    unknown: [raw],
  });
  assert.equal(state["lumen-alex"].length, 1);
  assert.equal(state["lumen-alex"][0].text, "Hola");
  assert.equal("url" in state["lumen-alex"][0].attachment!, false);
  assert.equal("injected" in state["lumen-alex"][0], false);
  assert.equal("unknown" in state, false);
  assert.deepEqual(
    Object.keys(state),
    CONVERSATIONS.map((item) => item.id),
  );
});

test("las claves heredadas no sustituyen hilos y los historiales tienen límite", () => {
  const raw = {
    id: "m-1",
    author: "customer",
    text: "demo",
    createdAt: "2026-10-28T12:00:00Z",
  };
  const inherited = Object.create({ "lumen-alex": [raw] });
  assert.equal(normalizeMessageStore(inherited)["lumen-alex"].length, 2);
  const list = Array.from({ length: MAX_THREAD_MESSAGES + 20 }, (_, index) => ({
    ...raw,
    id: `m-${index}`,
  }));
  const bounded = normalizeMessageStore({ "lumen-alex": list })["lumen-alex"];
  assert.equal(bounded.length, MAX_THREAD_MESSAGES);
  assert.equal(bounded[0].id, "m-20");
});

test("el hilo se guarda entre perspectivas sin incluir bytes ni URLs de archivos", () =>
  withStorage((store, events) => {
    const attachment = {
      id: "file-1",
      name: "archivo.txt",
      size: 4,
      mime: "text/plain",
    };
    const result = appendMessage(
      "lumen-alex",
      "business",
      "  Mensaje de prueba  ",
      attachment,
    );
    assert.equal(result.ok, true);
    const messages = loadMessages()["lumen-alex"];
    assert.equal(messages.at(-1)?.author, "business");
    assert.equal(messages.at(-1)?.text, "Mensaje de prueba");
    assert.equal(messages.at(-1)?.attachment?.name, "archivo.txt");
    const serialized = store.get(MESSAGE_STORAGE_KEY)!;
    assert.ok(!serialized.includes("blob:") && !serialized.includes("data:"));
    assert.ok(events.includes(MESSAGE_EVENT));
  }));

test("los mensajes vacíos, excesivos o de conversaciones desconocidas se rechazan", () =>
  withStorage(() => {
    assert.equal(appendMessage("lumen-alex", "customer", "  ").ok, false);
    assert.equal(appendMessage("unknown", "business", "Hola").ok, false);
    assert.equal(
      appendMessage(
        "lumen-alex",
        "business",
        "x".repeat(MAX_MESSAGE_LENGTH + 1),
      ).ok,
      false,
    );
  }));

test("el almacenamiento bloqueado y el JSON corrupto conservan la demo sin fingir guardado", () => {
  withStorage(() => {
    assert.equal(saveMessages(normalizeMessageStore(null)), false);
    assert.equal(appendMessage("lumen-alex", "business", "demo").ok, false);
  }, true);
  withStorage((store) => {
    store.set(MESSAGE_STORAGE_KEY, "{corrupt");
    assert.equal(loadMessages()["lumen-alex"].length, 2);
  });
});
