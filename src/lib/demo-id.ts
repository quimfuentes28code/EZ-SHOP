type DemoCrypto = {
  randomUUID?: () => string;
  getRandomValues?: (bytes: Uint8Array) => Uint8Array;
};

let sequence = 0;

/** Local demo identifiers only; never use these as credentials or access tokens. */
export function createDemoId(source: DemoCrypto | null = globalThis.crypto): string {
  try {
    if (typeof source?.randomUUID === "function") return source.randomUUID();
  } catch {
    // randomUUID can be unavailable on an iPhone opened over local HTTP.
  }
  try {
    if (typeof source?.getRandomValues === "function") {
      const bytes = source.getRandomValues(new Uint8Array(16));
      return `demo-${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`;
    }
  } catch {
    // The prototype still works if a browser disables both crypto APIs.
  }
  sequence += 1;
  return `demo-${Date.now().toString(36)}-${sequence.toString(36)}`;
}
