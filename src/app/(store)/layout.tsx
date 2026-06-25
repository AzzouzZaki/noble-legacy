import React from "react";
import Navbar from "@/components/store/Navbar";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white text-primary">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <footer className="bg-white border-t border-divider py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <p className="text-lg font-bold font-tajawal">العريقة</p>
            <p className="text-[10px] text-muted-text mt-0.5 tracking-wider uppercase font-medium">Noble Legacy</p>
          </div>
          <div className="text-center text-sm text-muted-text">
            <p>البريد الإلكتروني: contact@noblelegacy.dz</p>
            <p className="mt-1">الهاتف: 0550000000 +213</p>
          </div>
          <div className="text-center md:text-left text-xs text-muted-text">
            <p>© {new Date().getFullYear()} العريقة. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
