"use client";

import { useEffect, useState } from "react";
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "men" | "kids">("all");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, []);

  const getProductCategory = (product: Product) => {
    const name = (product.name || "").toLowerCase();
    const desc = (product.description || "").toLowerCase();
    if (
      name.includes("kid") ||
      name.includes("child") ||
      name.includes("baby") ||
      name.includes("أطفال") ||
      desc.includes("أطفال")
    ) {
      return "kids";
    }
    return product.id % 2 === 0 ? "men" : "kids";
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === "all") return true;
    return getProductCategory(product) === selectedCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {/* Page Title */}
      <div className="text-center md:text-right mb-8">
        <h1 className="text-3xl font-bold text-primary font-tajawal">جميع المنتجات</h1>
        <p className="text-sm text-muted-text mt-1">تصفح مجموعتنا الكاملة من الملابس والأزياء</p>
      </div>

      {/* Filter Options */}
      <div className="flex justify-center md:justify-start gap-4 mb-10 border-b border-divider pb-4">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 cursor-pointer ${
            selectedCategory === "all"
              ? "bg-primary text-white"
              : "text-muted-text hover:text-black hover:bg-neutral-100"
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setSelectedCategory("men")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 cursor-pointer ${
            selectedCategory === "men"
              ? "bg-primary text-white"
              : "text-muted-text hover:text-black hover:bg-neutral-100"
          }`}
        >
          رجالي
        </button>
        <button
          onClick={() => setSelectedCategory("kids")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 cursor-pointer ${
            selectedCategory === "kids"
              ? "bg-primary text-white"
              : "text-muted-text hover:text-black hover:bg-neutral-100"
          }`}
        >
          أطفال
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-neutral-100 rounded-lg" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-divider rounded-xl">
          <p className="text-lg text-muted-text font-medium">عذراً، لم نجد أي منتجات في هذا القسم حالياً.</p>
        </div>
      )}
    </div>
  );
}
