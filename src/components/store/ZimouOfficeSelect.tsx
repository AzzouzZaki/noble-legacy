"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";

type DeliveryMode = "home" | "office";

export interface ZimouOfficeOption {
  id: number;
  name: string;
  deliveryPrice: number;
  partnerCompanyName: string | null;
  address: string;
  communeId: number;
}

interface ZimouWilayaOption {
  id: number;
  name: string;
}

interface ZimouCommuneOption {
  id: number;
  name: string;
  wilayaId: number;
  wilaya: ZimouWilayaOption;
}

interface ZimouDeliveryQuoteOption {
  departure: string;
  deliveryType: string;
  deliveryPrice: number;
  paidByPromo: boolean;
}

export interface ZimouDeliveryChoice {
  mode: DeliveryMode;
  communeId: number;
  communeName: string;
  wilayaName: string;
  label: string;
  price: number;
  office?: ZimouOfficeOption;
  quote: ZimouDeliveryQuoteOption;
}

interface ZimouOfficeSelectProps {
  mode: DeliveryMode;
  selectedChoice: ZimouDeliveryChoice | null;
  onSelectChoice: (choice: ZimouDeliveryChoice | null) => void;
  error?: string;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function quoteTextMatchesOffice(quote: ZimouDeliveryQuoteOption, office: ZimouOfficeOption) {
  const quoteText = normalizeText(quote.deliveryType);
  return (
    quoteText.includes(normalizeText(office.address)) ||
    quoteText.includes(normalizeText(office.name)) ||
    (office.partnerCompanyName ? quoteText.includes(normalizeText(office.partnerCompanyName)) : false)
  );
}

function scoreOfficeQuote(quote: ZimouDeliveryQuoteOption, office: ZimouOfficeOption): number {
  let score = normalizeText(quote.deliveryType).includes("point relai") ? 10 : 0;
  if (quoteTextMatchesOffice(quote, office)) score += 100;
  return score;
}

export default function ZimouOfficeSelect({
  mode,
  selectedChoice,
  onSelectChoice,
  error,
}: ZimouOfficeSelectProps) {
  const [wilayas, setWilayas] = useState<ZimouWilayaOption[]>([]);
  const [communes, setCommunes] = useState<ZimouCommuneOption[]>([]);
  const [offices, setOffices] = useState<ZimouOfficeOption[]>([]);
  const [quotes, setQuotes] = useState<ZimouDeliveryQuoteOption[]>([]);
  const [selectedWilayaId, setSelectedWilayaId] = useState<number | null>(null);
  const [selectedCommuneId, setSelectedCommuneId] = useState<number | null>(null);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/zimou/wilayas").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch wilayas");
        return res.json();
      }),
      fetch("/api/zimou/communes").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch communes");
        return res.json();
      }),
      fetch("/api/zimou/offices").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch offices");
        return res.json();
      }),
    ])
      .then(([wilayasPayload, communesPayload, officesPayload]) => {
        if (!active) return;
        setWilayas(Array.isArray(wilayasPayload.data) ? wilayasPayload.data : []);
        setCommunes(Array.isArray(communesPayload.data) ? communesPayload.data : []);
        setOffices(Array.isArray(officesPayload.data) ? officesPayload.data : []);
        setLoadingLists(false);
      })
      .catch((err) => {
        console.error("Failed to fetch Zimou delivery data:", err);
        if (!active) return;
        setLoadError("تعذر تحميل بيانات التوصيل");
        setLoadingLists(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCommuneId) {
      return;
    }

    let active = true;
    const loadingTimeout = window.setTimeout(() => {
      if (active) setLoadingQuotes(true);
    }, 0);

    fetch(`/api/zimou/quotes?communeId=${selectedCommuneId}`)
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          return {
            data: [],
            error: payload?.error || "Failed to fetch quotes",
          };
        }
        return res.json();
      })
      .then((payload) => {
        if (!active) return;
        setQuotes(Array.isArray(payload.data) ? payload.data : []);
        setLoadError(payload.error ? "تعذر حساب أسعار التوصيل" : null);
        setLoadingQuotes(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("تعذر حساب أسعار التوصيل");
        setQuotes([]);
        setLoadingQuotes(false);
      });

    return () => {
      active = false;
      window.clearTimeout(loadingTimeout);
    };
  }, [selectedCommuneId]);

  const selectedCommune = communes.find((commune) => commune.id === selectedCommuneId) || null;
  const filteredCommunes = useMemo(
    () => communes.filter((commune) => commune.wilayaId === selectedWilayaId),
    [communes, selectedWilayaId]
  );
  const availableOffices = useMemo(
    () => offices.filter((office) => office.communeId === selectedCommuneId),
    [offices, selectedCommuneId]
  );
  const homeQuotes = useMemo(
    () =>
      quotes
        .filter((quote) => !normalizeText(quote.deliveryType).includes("point relai"))
        .sort((a, b) => a.deliveryPrice - b.deliveryPrice),
    [quotes]
  );

  const handleWilayaChange = (value: string) => {
    setSelectedWilayaId(value ? Number(value) : null);
    setSelectedCommuneId(null);
    setQuotes([]);
    onSelectChoice(null);
  };

  const handleCommuneChange = (value: string) => {
    setSelectedCommuneId(value ? Number(value) : null);
    setQuotes([]);
    onSelectChoice(null);
  };

  const makeChoice = (
    label: string,
    price: number,
    quote: ZimouDeliveryQuoteOption,
    office?: ZimouOfficeOption
  ): ZimouDeliveryChoice | null => {
    if (!selectedCommune) return null;

    return {
      mode,
      communeId: selectedCommune.id,
      communeName: selectedCommune.name,
      wilayaName: selectedCommune.wilaya.name,
      label,
      price,
      office,
      quote,
    };
  };

  const getOfficeQuote = (office: ZimouOfficeOption): ZimouDeliveryQuoteOption =>
      quotes
        .filter((item) => normalizeText(item.deliveryType).includes("point relai"))
        .map((item) => ({ item, score: scoreOfficeQuote(item, office) }))
        .sort((a, b) => b.score - a.score || a.item.deliveryPrice - b.item.deliveryPrice)[0]?.item ||
      quotes[0] || {
        departure: office.partnerCompanyName || office.name,
        deliveryType: office.name,
        deliveryPrice: office.deliveryPrice,
        paidByPromo: false,
      };

  const formatOfficeOption = (office: ZimouOfficeOption): string => {
    const quote = getOfficeQuote(office);
    const company = office.partnerCompanyName || quote.departure || office.name;
    return `${company} - ${office.address} - ${formatPrice(quote.deliveryPrice)}`;
  };

  const handleOfficeChange = (value: string) => {
    const office = availableOffices.find((item) => item.id === Number(value));
    if (!office) {
      onSelectChoice(null);
      return;
    }

    const quote = getOfficeQuote(office);
    onSelectChoice(makeChoice(office.name, quote.deliveryPrice, quote, office));
  };

  const handleHomeQuoteChange = (value: string) => {
    const quote = homeQuotes.find((item) => item.deliveryType === value);
    if (!quote) {
      onSelectChoice(null);
      return;
    }

    onSelectChoice(makeChoice(quote.deliveryType, quote.deliveryPrice, quote));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-primary mb-1.5 font-tajawal">
            الولاية *
          </label>
          <select
            value={selectedWilayaId ?? ""}
            onChange={(event) => handleWilayaChange(event.target.value)}
            disabled={loadingLists}
            className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all disabled:bg-neutral-100"
          >
            <option value="">{loadingLists ? "جاري التحميل..." : "اختر الولاية"}</option>
            {wilayas.map((wilaya) => (
              <option key={wilaya.id} value={wilaya.id}>
                {wilaya.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-primary mb-1.5 font-tajawal">
            البلدية *
          </label>
          <select
            value={selectedCommuneId ?? ""}
            onChange={(event) => handleCommuneChange(event.target.value)}
            disabled={!selectedWilayaId || loadingLists}
            className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all disabled:bg-neutral-100"
          >
            <option value="">{selectedWilayaId ? "اختر البلدية" : "اختر الولاية أولا"}</option>
            {filteredCommunes.map((commune) => (
              <option key={commune.id} value={commune.id}>
                {commune.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "office" ? (
        <div>
          <label className="block text-sm font-bold text-primary mb-1.5 font-tajawal">
            مكتب الاستلام *
          </label>
          <select
            value={selectedChoice?.office?.id ?? ""}
            onChange={(event) => handleOfficeChange(event.target.value)}
            disabled={!selectedCommuneId || loadingQuotes}
            className={`w-full bg-white border rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all disabled:bg-neutral-100 ${
              error ? "border-red-500 ring-1 ring-red-500" : "border-neutral-300"
            }`}
          >
            <option value="">
              {loadingQuotes ? "جاري حساب الأسعار..." : "اختر مكتب الاستلام"}
            </option>
            {availableOffices.map((office) => (
              <option key={office.id} value={office.id}>
                {formatOfficeOption(office)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-bold text-primary mb-1.5 font-tajawal">
            شركة / نوع التوصيل *
          </label>
          <select
            value={selectedChoice?.quote.deliveryType ?? ""}
            onChange={(event) => handleHomeQuoteChange(event.target.value)}
            disabled={!selectedCommuneId || loadingQuotes}
            className={`w-full bg-white border rounded-lg px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all disabled:bg-neutral-100 ${
              error ? "border-red-500 ring-1 ring-red-500" : "border-neutral-300"
            }`}
          >
            <option value="">
              {loadingQuotes ? "جاري حساب الأسعار..." : "اختر شركة التوصيل"}
            </option>
            {homeQuotes.map((quote) => (
              <option key={`${quote.departure}-${quote.deliveryType}`} value={quote.deliveryType}>
                {quote.deliveryType} - {formatPrice(quote.deliveryPrice)}
              </option>
            ))}
          </select>
        </div>
      )}

      {loadError && <p className="text-xs font-semibold text-red-600 font-tajawal">{loadError}</p>}
      {error && <p className="text-xs font-semibold text-red-600 font-tajawal">{error}</p>}

    </div>
  );
}
