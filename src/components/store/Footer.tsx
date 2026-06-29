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
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-7">
        
        {/* Level 1: Top Information Grid */}
        <div className="grid w-full grid-cols-3 justify-items-stretch gap-3 sm:gap-6 lg:gap-8">
          
          {/* Column 1: Store Links */}
          <div className="min-w-0 space-y-1.5 sm:space-y-2">
            <h3 className="truncate text-xs font-medium text-muted-text">المتجر</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {storeLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="block truncate text-[11px] sm:text-sm font-medium hover:text-black transition-colors duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Contact Information */}
          <div className="min-w-0 space-y-1.5 text-center sm:space-y-2">
            <h3 className="truncate text-xs font-medium text-muted-text">تواصل معنا</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {contactInfo.map((info, index) => (
                <li key={info.label} className={`${index > 1 ? "hidden sm:block" : ""} min-w-0 truncate text-[11px] sm:text-sm font-medium`}>
                  <span className="hidden truncate text-xs text-muted-text mb-1 sm:block">{info.label}</span>
                  {info.href ? (
                    <a href={info.href} className="inline-block max-w-full truncate hover:text-black transition-colors duration-200" dir="ltr">
                      {info.value}
                    </a>
                  ) : (
                    <span className="block truncate">{info.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Social Media */}
          <div className="min-w-0 space-y-1.5 text-left sm:space-y-2">
            <h3 className="truncate text-xs font-medium text-muted-text">تابعنا</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {socialLinks.map((social) => (
                <li key={social.name}>
                  <a 
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label={social.ariaLabel}
                    className="block max-w-full truncate text-[11px] font-medium hover:text-black transition-colors duration-200 sm:text-sm"
                  >
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Level 2: Large Centered Logo */}
        <div className="mt-5 hidden justify-center border-t border-divider pt-4 sm:flex">
          <Link href="/" className="group text-center focus:outline-none rounded-lg focus:ring-2 focus:ring-black focus:ring-offset-4">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary group-hover:opacity-80 transition-opacity duration-300">
              العريقة
            </h2>
            <p className="text-[9px] md:text-[10px] text-muted-text mt-1 tracking-[0.22em] uppercase font-medium">
              Noble Legacy
            </p>
          </Link>
        </div>

        {/* Level 3: Bottom Legal Row */}
        <div className="mt-4 flex flex-col gap-2 border-t border-divider pt-3 text-[10px] text-muted-text sm:mt-5 sm:gap-3 sm:pt-4 sm:text-xs md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-right">
            © {new Date().getFullYear()} العريقة. جميع الحقوق محفوظة.
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
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
