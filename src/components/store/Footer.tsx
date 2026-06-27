import Link from "next/link";

const storeLinks = [
  { name: "الرئيسية", href: "/" },
  { name: "المنتجات", href: "/products" },
  { name: "سلة التسوق", href: "/cart" },
];

const contactInfo = [
  { label: "الهاتف", value: "+213 550 00 00 00", href: "tel:+213550000000" },
  { label: "واتساب", value: "+213 550 00 00 00", href: "https://wa.me/213550000000" },
  { label: "البريد الإلكتروني", value: "contact@noblelegacy.dz", href: "mailto:contact@noblelegacy.dz" },
  { label: "العنوان", value: "الجزائر العاصمة، الجزائر", href: null },
];

const socialLinks = [
  { name: "إنستغرام", href: "#", ariaLabel: "زيارة حساب المتجر على إنستغرام" },
  { name: "تيك توك", href: "#", ariaLabel: "زيارة حساب المتجر على تيك توك" },
  { name: "فيسبوك", href: "#", ariaLabel: "زيارة صفحة المتجر على فيسبوك" },
];

const legalLinks = [
  { name: "سياسة الخصوصية", href: "#" },
  { name: "الشروط والأحكام", href: "#" },
  { name: "سياسة التوصيل", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-divider text-primary font-tajawal">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        
        {/* Level 1: Top Information Grid */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 lg:gap-12">
          
          {/* Column 1: Store Links */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs font-medium text-muted-text">المتجر</h3>
            <ul className="space-y-2 sm:space-y-3">
              {storeLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-xs sm:text-sm font-medium hover:text-black transition-colors duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Contact Information */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs font-medium text-muted-text">تواصل معنا</h3>
            <ul className="space-y-2 sm:space-y-3">
              {contactInfo.map((info) => (
                <li key={info.label} className="text-xs sm:text-sm font-medium">
                  <span className="block text-xs text-muted-text mb-1">{info.label}</span>
                  {info.href ? (
                    <a href={info.href} className="hover:text-black transition-colors duration-200" dir="ltr" style={{ display: 'inline-block' }}>
                      {info.value}
                    </a>
                  ) : (
                    <span>{info.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Social Media */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs font-medium text-muted-text">تابعنا</h3>
            <ul className="space-y-2 sm:space-y-3">
              {socialLinks.map((social) => (
                <li key={social.name}>
                  <a 
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label={social.ariaLabel}
                    className="group inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium hover:text-black transition-colors duration-200"
                  >
                    <span>{social.name}</span>
                    <span className="opacity-0 translate-x-2 rtl:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 rtl:group-hover:translate-x-0 transition-all duration-300">
                      <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Level 2: Large Centered Logo */}
        <div className="mt-10 flex justify-center border-t border-divider pt-8">
          <Link href="/" className="group text-center focus:outline-none rounded-lg focus:ring-2 focus:ring-black focus:ring-offset-4">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-primary group-hover:opacity-80 transition-opacity duration-300">
              العريقة
            </h2>
            <p className="text-[10px] md:text-xs text-muted-text mt-2 tracking-[0.3em] uppercase font-medium">
              Noble Legacy
            </p>
          </Link>
        </div>

        {/* Level 3: Bottom Legal Row */}
        <div className="mt-8 flex flex-col gap-4 border-t border-divider pt-5 text-xs text-muted-text md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-right">
            © {new Date().getFullYear()} العريقة. جميع الحقوق محفوظة.
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {legalLinks.map((link) => (
              <Link key={link.name} href={link.href} className="hover:text-black transition-colors duration-200">
                {link.name}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
