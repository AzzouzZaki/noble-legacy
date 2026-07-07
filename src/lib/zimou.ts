export interface ZimouOffice {
  id: number;
  name: string;
  deliveryPrice: number;
  partnerCompanyName: string | null;
  address: string;
  communeId: number;
}

export interface ZimouWilaya {
  id: number;
  name: string;
}

export interface ZimouCommune {
  id: number;
  name: string;
  wilayaId: number;
  zipCode: string | null;
  wilaya: ZimouWilaya;
}

export interface ZimouDeliveryQuote {
  departure: string;
  deliveryType: string;
  deliveryPrice: number;
  paidByPromo: boolean;
}

interface ZimouOfficeResource {
  id: number;
  name: string;
  delivery_price: string | null;
  partner_company_name?: string | null;
  address: string;
  commune_id: number;
}

interface ZimouWilayaResource {
  id: number;
  name: string;
}

interface ZimouCommuneResource {
  id: number;
  name: string;
  wilaya_id: number;
  zip_code: string | null;
  wilaya: ZimouWilayaResource;
}

interface ZimouListResponse<T> {
  data: T[];
}

interface ZimouComparatorResource {
  departure: string;
  delivery_type: string;
  delivery_price: number | string | null;
  paid_by_promo: boolean;
}

const ZIMOU_API_BASE_URL = "https://zimou.express/api";

function parseZimouPrice(value: string | number | null): number {
  if (!value) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = value.replace(/[^\d,.]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 500
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      console.warn(
        `[Zimou] Outbound request to ${url} failed with status ${response.status}. Retrying... (${i + 1}/${retries})`
      );
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(
        `[Zimou] Outbound request to ${url} threw error: ${error}. Retrying... (${i + 1}/${retries})`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
  }
  throw new Error(`[Zimou] Outbound request to ${url} failed after ${retries} retries`);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

async function getZimouToken(): Promise<string> {
  if (process.env.ZIMOU_API_TOKEN) {
    return process.env.ZIMOU_API_TOKEN;
  }

  const response = await fetchWithRetry(`${ZIMOU_API_BASE_URL}/v3/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: requireEnv("ZIMOU_EMAIL"),
      password: requireEnv("ZIMOU_PASSWORD"),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Zimou login failed with status ${response.status}`);
  }

  const token = await response.json();
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Zimou login returned an invalid token");
  }

  return token;
}

export async function fetchZimouOffices(): Promise<ZimouOffice[]> {
  const token = await getZimouToken();
  const response = await fetchWithRetry(`${ZIMOU_API_BASE_URL}/v3/helpers/offices`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Zimou offices request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ZimouListResponse<ZimouOfficeResource>;

  if (!Array.isArray(payload.data)) {
    throw new Error("Zimou offices response is missing data[]");
  }

  return payload.data.map((office) => ({
    id: office.id,
    name: office.name,
    deliveryPrice: parseZimouPrice(office.delivery_price),
    partnerCompanyName: office.partner_company_name || null,
    address: office.address,
    communeId: office.commune_id,
  }));
}

export async function fetchZimouWilayas(): Promise<ZimouWilaya[]> {
  const token = await getZimouToken();
  const response = await fetchWithRetry(`${ZIMOU_API_BASE_URL}/v3/helpers/wilayas`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Zimou wilayas request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ZimouListResponse<ZimouWilayaResource>;
  if (!Array.isArray(payload.data)) {
    throw new Error("Zimou wilayas response is missing data[]");
  }

  return payload.data.map((wilaya) => ({
    id: wilaya.id,
    name: wilaya.name,
  }));
}

export async function fetchZimouCommunes(): Promise<ZimouCommune[]> {
  const token = await getZimouToken();
  const response = await fetchWithRetry(`${ZIMOU_API_BASE_URL}/v3/helpers/communes`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Zimou communes request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ZimouListResponse<ZimouCommuneResource>;
  if (!Array.isArray(payload.data)) {
    throw new Error("Zimou communes response is missing data[]");
  }

  return payload.data.map((commune) => ({
    id: commune.id,
    name: commune.name,
    wilayaId: commune.wilaya_id,
    zipCode: commune.zip_code,
    wilaya: {
      id: commune.wilaya.id,
      name: commune.wilaya.name,
    },
  }));
}

export async function fetchZimouDeliveryQuotes(
  communeId: number
): Promise<ZimouDeliveryQuote[]> {
  const token = await getZimouToken();
  const params = new URLSearchParams({ commune_id: String(communeId) });
  const response = await fetchWithRetry(`${ZIMOU_API_BASE_URL}/v3/comparators?${params}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Zimou comparators request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ZimouListResponse<ZimouComparatorResource>;
  if (!Array.isArray(payload.data)) {
    throw new Error("Zimou comparators response is missing data[]");
  }

  return payload.data.map((quote) => ({
    departure: quote.departure,
    deliveryType: quote.delivery_type,
    deliveryPrice: parseZimouPrice(quote.delivery_price),
    paidByPromo: Boolean(quote.paid_by_promo),
  }));
}

function normalizeMatchText(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreQuoteForOffice(quote: ZimouDeliveryQuote, office: ZimouOffice): number {
  const quoteText = normalizeMatchText(quote.deliveryType);
  const address = normalizeMatchText(office.address);
  const name = normalizeMatchText(office.name);
  const partner = normalizeMatchText(office.partnerCompanyName);

  let score = quoteText.includes("point relai") ? 10 : 0;
  if (address && quoteText.includes(address)) score += 80;
  if (name && quoteText.includes(name)) score += 20;
  if (partner && quoteText.includes(partner)) score += 20;

  return score;
}

export async function quoteZimouOffice(office: ZimouOffice): Promise<ZimouDeliveryQuote> {
  const quotes = await fetchZimouDeliveryQuotes(office.communeId);
  const pointRelayQuotes = quotes.filter((quote) =>
    normalizeMatchText(quote.deliveryType).includes("point relai")
  );
  const candidates = pointRelayQuotes.length > 0 ? pointRelayQuotes : quotes;

  if (candidates.length === 0) {
    throw new Error(`No Zimou delivery quotes found for commune ${office.communeId}`);
  }

  return candidates
    .map((quote) => ({
      quote,
      score: scoreQuoteForOffice(quote, office),
    }))
    .sort((a, b) => b.score - a.score || a.quote.deliveryPrice - b.quote.deliveryPrice)[0]
    .quote;
}
