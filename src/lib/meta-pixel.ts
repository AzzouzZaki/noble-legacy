"use client";

export type MetaPixelStandardEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Lead";

export type MetaPixelContentType = "product" | "product_group";

export type MetaPixelContentItem = {
  id: string;
  quantity?: number;
  item_price?: number;
};

export type MetaPixelEventIdentity = {
  event_id?: string;
  eventID?: string;
};

type MetaPixelCommercePayload = MetaPixelEventIdentity & {
  content_ids?: string[];
  contents?: MetaPixelContentItem[];
  content_name?: string;
  content_type?: MetaPixelContentType;
  currency?: string;
  value?: number;
};

export type PageViewPayload = MetaPixelEventIdentity;

export type ViewContentPayload = MetaPixelCommercePayload;

export type AddToCartPayload = MetaPixelCommercePayload & {
  quantity?: number;
};

export type InitiateCheckoutPayload = MetaPixelCommercePayload & {
  num_items?: number;
};

export type LeadPayload = MetaPixelCommercePayload & {
  status?: string;
};

export type MetaPixelEventPayloadMap = {
  PageView: PageViewPayload;
  ViewContent: ViewContentPayload;
  AddToCart: AddToCartPayload;
  InitiateCheckout: InitiateCheckoutPayload;
  Lead: LeadPayload;
};

export type MetaPixelPayload = MetaPixelEventPayloadMap[MetaPixelStandardEvent];

type MetaPixelOptions = {
  eventID?: string;
};

type MetaPixelTrackMode = "track" | "trackCustom";

type MetaPixelTrackOptions = {
  eventId?: string;
  eventKey?: string;
  dedupe?: boolean;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

const META_EVENT_NAMESPACE = "noble_legacy_meta";
const SESSION_ID_KEY = `${META_EVENT_NAMESPACE}:session_id`;
const ORDER_FLOW_PREFIX = `${META_EVENT_NAMESPACE}:order_flow`;
const EVENT_ID_PREFIX = `${META_EVENT_NAMESPACE}:event_id`;
const SENT_EVENTS_KEY = `${META_EVENT_NAMESPACE}:sent_events`;
const MAX_SENT_EVENT_KEYS = 80;
const META_PIXEL_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_META_PIXEL_DEBUG === "true";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function createId(prefix = "evt") {
  const cryptoValue =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${cryptoValue}`;
}

function normalizeEventKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 120);
}

function getStoredId(storageKey: string, prefix: string) {
  const storage = getStorage();

  if (!storage) return createId(prefix);

  const existingId = storage.getItem(storageKey);
  if (existingId) return existingId;

  const id = createId(prefix);
  storage.setItem(storageKey, id);
  return id;
}

export function getMetaSessionEventId() {
  return getStoredId(SESSION_ID_KEY, "session");
}

export function getMetaOrderFlowEventId(flowKey = "default") {
  const normalizedFlowKey = normalizeEventKey(flowKey) || "default";
  return getStoredId(`${ORDER_FLOW_PREFIX}:${normalizedFlowKey}`, "order_flow");
}

export function clearMetaOrderFlowEventId(flowKey = "default") {
  const storage = getStorage();
  if (!storage) return;

  const normalizedFlowKey = normalizeEventKey(flowKey) || "default";
  storage.removeItem(`${ORDER_FLOW_PREFIX}:${normalizedFlowKey}`);
}

export function createMetaEventId(prefix = "event") {
  return createId(normalizeEventKey(prefix) || "event");
}

export function getMetaEventId(
  eventName: MetaPixelStandardEvent | string,
  eventKey?: string
) {
  if (!eventKey) return createMetaEventId(String(eventName));

  const normalizedEventName = normalizeEventKey(String(eventName)) || "event";
  const normalizedEventKey = normalizeEventKey(eventKey) || "default";

  return getStoredId(
    `${EVENT_ID_PREFIX}:${normalizedEventName}:${normalizedEventKey}`,
    normalizedEventName
  );
}

function getPayloadEventId(payload?: MetaPixelEventIdentity): string | undefined {
  return payload?.event_id ?? payload?.eventID;
}

function sanitizePayload<TPayload extends MetaPixelEventIdentity>(payload?: TPayload) {
  if (!payload) return undefined;

  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) => key !== "event_id" && key !== "eventID" && value !== undefined
    )
  );

  return Object.keys(cleanedPayload).length > 0 ? cleanedPayload : undefined;
}

function getResolvedEventId(
  eventName: string,
  payload?: MetaPixelEventIdentity,
  options?: MetaPixelTrackOptions
) {
  return (
    options?.eventId ??
    getPayloadEventId(payload) ??
    (options?.eventKey ? getMetaEventId(eventName, options.eventKey) : undefined)
  );
}

function readSentEventKeys() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const value = storage.getItem(SENT_EVENTS_KEY);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function rememberSentEventKey(key: string) {
  const storage = getStorage();
  if (!storage) return;

  const nextKeys = [...readSentEventKeys().filter((sentKey) => sentKey !== key), key].slice(
    -MAX_SENT_EVENT_KEYS
  );

  try {
    storage.setItem(SENT_EVENTS_KEY, JSON.stringify(nextKeys));
  } catch {
    // Tracking should never break checkout if storage is unavailable.
  }
}

function shouldSkipDuplicateEvent(eventName: string, eventId?: string, dedupe = true) {
  if (!eventId || !dedupe) return false;

  const eventKey = `${eventName}:${eventId}`;
  const hasAlreadySent = readSentEventKeys().includes(eventKey);

  if (!hasAlreadySent) {
    rememberSentEventKey(eventKey);
  }

  return hasAlreadySent;
}

function debugMetaEvent(
  mode: MetaPixelTrackMode,
  eventName: string,
  payload?: object,
  eventId?: string,
  skipped = false
) {
  if (!META_PIXEL_DEBUG) return;

  console.info("[Meta Pixel]", {
    mode,
    event: eventName,
    event_id: eventId,
    payload: payload ?? null,
    skipped,
  });
}

function ensureFbq() {
  if (typeof window === "undefined") return null;

  if (typeof window.fbq === "function") {
    return window.fbq;
  }

  const queueStub = ((...args: unknown[]) => {
    queueStub.queue.push(args);
  }) as ((...args: unknown[]) => void) & {
    queue: unknown[][];
    loaded: boolean;
    version: string;
  };

  queueStub.queue = [];
  queueStub.loaded = true;
  queueStub.version = "2.0";

  window._fbq = queueStub;
  window.fbq = queueStub;

  return window.fbq;
}

function sendMetaEvent<TPayload extends MetaPixelEventIdentity>(
  mode: MetaPixelTrackMode,
  eventName: string,
  payload?: TPayload,
  options?: MetaPixelTrackOptions
) {
  const cleanedPayload = sanitizePayload(payload);
  const eventId = getResolvedEventId(eventName, payload, options);

  if (shouldSkipDuplicateEvent(eventName, eventId, options?.dedupe)) {
    debugMetaEvent(mode, eventName, cleanedPayload, eventId, true);
    return;
  }

  debugMetaEvent(mode, eventName, cleanedPayload, eventId);

  const fbq = ensureFbq();
  if (!fbq) return;

  const fbqOptions: MetaPixelOptions | undefined = eventId ? { eventID: eventId } : undefined;

  if (cleanedPayload && fbqOptions) {
    fbq(mode, eventName, cleanedPayload, fbqOptions);
    return;
  }

  if (cleanedPayload) {
    fbq(mode, eventName, cleanedPayload);
    return;
  }

  if (fbqOptions) {
    fbq(mode, eventName, undefined, fbqOptions);
    return;
  }

  fbq(mode, eventName, undefined);
}

export function trackMetaEvent<TEventName extends MetaPixelStandardEvent>(
  eventName: TEventName,
  payload?: MetaPixelEventPayloadMap[TEventName],
  options?: MetaPixelTrackOptions
) {
  sendMetaEvent("track", eventName, payload, options);
}

export function trackMetaCustomEvent<TPayload extends MetaPixelEventIdentity>(
  eventName: string,
  payload?: TPayload,
  options?: MetaPixelTrackOptions
) {
  sendMetaEvent("trackCustom", eventName, payload, options);
}

export function trackPageView(payload?: PageViewPayload, options?: MetaPixelTrackOptions) {
  trackMetaEvent("PageView", payload, options);
}

export function trackViewContent(
  payload?: ViewContentPayload,
  options?: MetaPixelTrackOptions
) {
  trackMetaEvent("ViewContent", payload, options);
}

export function trackAddToCart(payload?: AddToCartPayload, options?: MetaPixelTrackOptions) {
  trackMetaEvent("AddToCart", payload, options);
}

export function trackInitiateCheckout(
  payload?: InitiateCheckoutPayload,
  options?: MetaPixelTrackOptions
) {
  trackMetaEvent("InitiateCheckout", payload, options);
}

export function trackLead(payload?: LeadPayload, options?: MetaPixelTrackOptions) {
  trackMetaEvent("Lead", payload, options);
}
