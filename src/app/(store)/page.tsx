"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/store/ProductCard";

interface SizeEntry {
  id?: number | string;
  size: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number | null;
  imageUrl: string | null;
  sizes?: SizeEntry[];
}

export default function StoreHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data.slice(0, 4)); // Get 4 featured products
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
      {/* Hero Section */}
      <section className="relative bg-white py-24 md:py-36 border-b border-divider">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary leading-tight font-tajawal">
            مرحباً بكم في متجر العريقة
          </h1>
          <p className="text-lg md:text-xl text-muted-text max-w-2xl mx-auto font-tajawal">
            أزياء الشارع الراقية المصممة بعناية وتفاصيل عريقة تلائم ذوقك الرفيع.
          </p>
          <div className="pt-4">
            <Link
              href="/products"
              className="inline-block bg-primary text-white text-base font-medium px-8 py-3.5 rounded-lg hover:bg-primary-hover transition-colors duration-200"
            >
              تسوق الآن
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center md:text-right mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary font-tajawal">
            المنتجات المميزة
          </h2>
          <p className="text-sm text-muted-text mt-1">
            أحدث التصاميم المتاحة حالياً في متجرنا
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-100 rounded-lg" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-text">
            لا توجد منتجات مميزة متاحة حالياً.
          </div>
        )}
      </section>
    </div>
  );
}
