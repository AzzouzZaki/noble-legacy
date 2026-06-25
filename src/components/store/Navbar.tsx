"use client";

import Link from "next/link";
import CartIcon from "./CartIcon";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Right side: Brand Logo / Name */}
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary font-tajawal">
            العريقة <span className="text-[10px] text-muted-text block font-normal -mt-1 tracking-wider uppercase">Noble Legacy</span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex gap-10">
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:text-black transition-colors"
          >
            الرئيسية
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:text-black transition-colors"
          >
            المنتجات
          </Link>
        </nav>

        {/* Left side: Cart Icon */}
        <div className="flex items-center">
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
