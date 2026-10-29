"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatDemo } from "@/features/messaging/chat";
import { isChatBusinessId } from "@/features/messaging/model";

function MessagesContent() {
  const query = useSearchParams();
  const audience = query.get("como") === "empresa" ? "business" : "customer";
  const business = query.get("negocio");
  const businessId = isChatBusinessId(business) ? business : "photo";
  const initialConversationId = query.get("conversacion") ?? undefined;
  return (
    <ChatDemo
      key={`${audience}-${businessId}-${initialConversationId ?? "default"}`}
      audience={audience}
      businessId={businessId}
      initialConversationId={initialConversationId}
    />
  );
}
export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="container as-messaging">
          <h1>Mensajes</h1>
          <p className="muted">Preparando conversaciones de demostración…</p>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
