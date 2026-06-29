"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/store/ProductCard";

interface SizeEntry {
  id?: number | string;
  size: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  sizes?: SizeEntry[];
}

/* ── Floating keyword chip ── */
function FloatingWord({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`absolute select-none pointer-events-none text-neutral-200 font-extrabold font-tajawal ${className}`}
    >
      {text}
    </span>
  );
}

export default function StoreHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data.slice(0, 4));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ════════════════════════════ HERO ════════════════════════════ */}
      <section className="relative bg-white overflow-hidden min-h-[92vh] flex items-center border-b border-divider">
        {/* ── Animated background blobs ── */}
        <div
          aria-hidden="true"
          className="animate-blob-drift absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-neutral-100/70 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="animate-blob-drift-alt absolute -bottom-40 -left-40 w-[360px] h-[360px] rounded-full bg-neutral-100/60 blur-3xl"
        />

        {/* ── Floating streetwear keywords ── */}
        <FloatingWord text="ستايل"      className="text-5xl md:text-7xl top-[12%] right-[8%]  animate-float-slow     opacity-40" />
        <FloatingWord text="جودة"       className="text-4xl md:text-6xl top-[60%] right-[5%]  animate-float-slow-alt opacity-30" />
        <FloatingWord text="بساطة"      className="text-3xl md:text-5xl top-[22%] left-[6%]   animate-float-slow     opacity-25" />
        <FloatingWord text="تيشيرتات"  className="text-2xl md:text-4xl bottom-[18%] left-[12%] animate-float-slow-alt opacity-30" />
        <FloatingWord text="تصاميم"    className="text-3xl md:text-5xl bottom-[35%] right-[15%] animate-float-slow   opacity-20" />

        {/* ── Hero content ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 md:py-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Right column (RTL first): Text */}
            <div className="text-center md:text-right space-y-7 order-1">
              {/* Badge */}
              <span className="animate-fade-up inline-block bg-neutral-100 text-primary text-xs font-bold px-4 py-2 rounded-full tracking-wide font-tajawal border border-divider">
                مجموعة جديدة وصلت الآن
              </span>

              {/* Main heading */}
              <h1 className="animate-fade-up-delay-1 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-primary font-tajawal">
                مرحباً بك في
                <br />
                <span className="relative inline-block">
                  عالم الستايل
                  {/* Decorative underline */}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 right-0 w-full h-1.5 bg-black/10 rounded-full"
                  />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="animate-fade-up-delay-2 text-lg md:text-xl text-muted-text max-w-lg mx-auto md:mx-0 leading-relaxed font-tajawal">
                اكتشف تصاميم تيشيرتات عصرية تجمع بين البساطة، الجودة، والهوية الشبابية.
              </p>

              {/* CTA */}
              <div className="animate-fade-up-delay-3 pt-2 space-y-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-primary text-white text-base font-bold px-10 py-4 rounded-xl hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 font-tajawal"
                >
                  تسوق الآن
                  <svg
                    className="w-5 h-5 rtl:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
                <p className="text-sm text-muted-text font-tajawal">
                  تشكيلة مختارة بعناية لإطلالة يومية مختلفة.
                </p>
              </div>
            </div>

            {/* Left column (RTL second): Visual area */}
            <div className="hero-desktop-product-card order-2 flex [@media(max-width:767px)]:hidden items-center justify-center md:justify-start relative" aria-hidden="true">
              {/* ── Abstract floating product card mockup ── */}
              <div className="relative w-full max-w-sm mx-auto md:mx-0">
                {/* Main card */}
                <div className="animate-float-slow bg-white border border-divider rounded-2xl shadow-xl p-5 space-y-4">
                  {/* Fake image placeholder */}
                  <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center overflow-hidden relative">
                    {/* T-shirt icon silhouette */}
                    <svg
                      className="w-32 h-32 text-neutral-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16.5 6a.5.5 0 0 0 .09-.992l-3.59-.5V3a1 1 0 0 0-2 0v1.508l-3.59.5A.5.5 0 0 0 7.5 6H4a1 1 0 0 0-.707 1.707L6 10.414V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9.586l2.707-2.707A1 1 0 0 0 20 6h-3.5z" />
                    </svg>
                    {/* "NEW" tag */}
                    <span className="absolute top-3 right-3 bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      جديد
                    </span>
                  </div>
                  {/* Fake product info */}
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                  {/* Fake price row */}
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-5 w-20 bg-neutral-200 rounded" />
                    <div className="h-9 w-24 bg-black rounded-lg" />
                  </div>
                </div>

                {/* Stacked offset card behind */}
                <div className="animate-float-slow-alt absolute -bottom-4 -left-4 w-full h-full bg-neutral-50 border border-divider rounded-2xl -z-10 shadow-sm" />

                {/* Decorative dots */}
                <div className="absolute -top-6 -right-6 grid grid-cols-3 gap-2">
                  {[...Array(9)].map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-neutral-200 rounded-full animate-soft-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Thin animated decorative line ── */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent"
        />
      </section>

      {/* ════════════════════════ FEATURED PRODUCTS ════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full">
        <div className="text-center md:text-right mb-14 space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary font-tajawal">
            منتجات مختارة لك
          </h2>
          <p className="text-base text-muted-text font-tajawal max-w-md mx-auto md:mx-0">
            ابدأ من القطع الأكثر تميزاً في المتجر.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-square bg-neutral-100 rounded-lg" />
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
                <div className="h-3 bg-neutral-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-14 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-white text-primary text-base font-bold px-8 py-3.5 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 font-tajawal"
              >
                عرض كل المنتجات
                <svg
                  className="w-4 h-4 rtl:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-text font-tajawal">
              سيتم إضافة المنتجات قريباً.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
