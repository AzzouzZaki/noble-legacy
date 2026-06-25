"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CartItem,
  getCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartTotal,
} from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "office" | null>("home");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    refreshCart();
  }, []);

  const refreshCart = () => {
    setCartItems(getCart());
  };

  const dispatchCartUpdate = () => {
    window.dispatchEvent(new Event("cart-updated"));
  };

  const handleUpdateQuantity = (productId: number, size: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId, size);
    } else {
      updateQuantity(productId, size, newQty);
    }
    refreshCart();
    dispatchCartUpdate();
  };

  const handleRemove = (productId: number, size: string) => {
    removeFromCart(productId, size);
    refreshCart();
    dispatchCartUpdate();
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!deliveryMethod) errors.deliveryMethod = "يرجى اختيار طريقة التوصيل";
    if (!fullName.trim()) errors.fullName = "الاسم الكامل مطلوب";
    if (!phone.trim()) errors.phone = "رقم الهاتف مطلوب";
    if (!address.trim()) errors.address = "عنوان التوصيل مطلوب";
    
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "البريد الإلكتروني غير صالح";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const totalAmount = getCartTotal(cartItems);

    const payload = {
      customerName: fullName,
      customerPhone: phone,
      customerEmail: email || null,
      shippingAddress: deliveryMethod === "home" ? `[التوصيل إلى المنزل] ${address}` : `[التوصيل إلى المكتب] ${address}`,
      totalAmount: String(totalAmount),
      items: cartItems.map(item => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        unitPrice: String(item.price)
      }))
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to submit order");
      }

      // Success
      setSubmitSuccess(true);
      clearCart();
      refreshCart();
      dispatchCartUpdate();
    } catch (err) {
      console.error(err);
      setSubmitError("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Avoid hydration mismatch
  if (!isMounted) return null;

  if (submitSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center min-h-screen">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 md:p-12">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-primary font-tajawal mb-4">تم إرسال طلبك بنجاح. سنتواصل معك قريباً لتأكيد الطلب.</h2>
          <Link href="/products" className="inline-block mt-8 bg-black hover:bg-neutral-900 text-white font-bold py-3 px-8 rounded-lg transition-colors font-tajawal">
            متابعة التسوق
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center min-h-screen flex flex-col items-center justify-center">
        <svg className="w-20 h-20 text-neutral-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
        <h1 className="text-2xl font-bold text-primary font-tajawal mb-8">سلة التسوق فارغة حالياً</h1>
        <Link href="/products" className="bg-black hover:bg-neutral-900 text-white font-bold py-3 px-8 rounded-lg transition-colors font-tajawal">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  const subtotal = getCartTotal(cartItems);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <h1 className="text-3xl font-extrabold text-primary font-tajawal mb-10">سلة التسوق</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Right side (RTL): Cart Items List */}
        <div className="flex-1 space-y-6">
          {cartItems.map((item) => (
            <div key={`${item.productId}-${item.size}`} className="flex flex-col sm:flex-row gap-6 p-4 border border-divider rounded-xl bg-white">
              <Link 
                href={`/product/${item.productId}`}
                aria-label={`عرض المنتج ${item.name}`}
                className="w-24 h-24 sm:w-32 sm:h-32 bg-neutral-50 rounded-lg overflow-hidden flex-shrink-0 border border-divider focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 block group"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition duration-200 group-hover:scale-105 group-hover:opacity-90" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-text group-hover:bg-neutral-100 transition duration-200">بدون صورة</div>
                )}
              </Link>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-primary font-tajawal line-clamp-2">{item.name}</h3>
                    <p className="text-sm text-muted-text mt-1 font-tajawal">المقاس: <span className="font-bold text-black">{item.size}</span></p>
                    <p className="text-sm text-muted-text mt-1 font-tajawal">سعر القطعة: <span className="font-bold text-black">{formatPrice(item.price)}</span></p>
                  </div>
                  <button 
                    onClick={() => handleRemove(item.productId, item.size)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold font-tajawal flex items-center gap-1 transition-colors"
                  >
                    حذف
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-4 sm:mt-0">
                  <div className="flex items-center space-x-reverse space-x-3 w-28 border border-divider rounded-lg p-1 bg-white">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.productId, item.size, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-lg font-bold text-primary hover:bg-neutral-100 rounded transition-colors"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.productId, item.size, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-lg font-bold text-primary hover:bg-neutral-100 rounded transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="font-bold text-primary text-lg font-tajawal">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Link href="/products" className="text-sm font-bold text-muted-text hover:text-black transition-colors font-tajawal">
              &rarr; متابعة التسوق
            </Link>
          </div>
        </div>

        {/* Left side (RTL): Order Summary & Checkout Form */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="bg-neutral-50 rounded-xl p-6 border border-divider sticky top-24">
            <h2 className="text-xl font-bold text-primary font-tajawal mb-6 pb-4 border-b border-divider">ملخص الطلب</h2>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-muted-text font-bold font-tajawal">الإجمالي</span>
              <span className="text-2xl font-extrabold text-primary font-tajawal">{formatPrice(subtotal)}</span>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold font-tajawal">
                  {submitError}
                </div>
              )}

              <div className="space-y-3 mb-2">
                <label className="text-sm font-bold text-primary block font-tajawal">طريقة التوصيل *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => {
                      setDeliveryMethod("home");
                      setFormErrors(prev => ({ ...prev, deliveryMethod: "" }));
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDeliveryMethod("home");
                        setFormErrors(prev => ({ ...prev, deliveryMethod: "" }));
                      }
                    }}
                    className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${deliveryMethod === "home" ? "border-black shadow-sm" : "border-neutral-200 hover:border-neutral-300"}`}
                  >
                    <span className="text-2xl">🏠</span>
                    <span className="text-sm font-bold font-tajawal text-center">التوصيل إلى المنزل</span>
                  </div>
                  <div
                    onClick={() => {
                      setDeliveryMethod("office");
                      setFormErrors(prev => ({ ...prev, deliveryMethod: "" }));
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDeliveryMethod("office");
                        setFormErrors(prev => ({ ...prev, deliveryMethod: "" }));
                      }
                    }}
                    className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${deliveryMethod === "office" ? "border-black shadow-sm" : "border-neutral-200 hover:border-neutral-300"}`}
                  >
                    <span className="text-2xl">🏢</span>
                    <span className="text-sm font-bold font-tajawal text-center">التوصيل إلى المكتب</span>
                  </div>
                </div>
                {formErrors.deliveryMethod && <p className="text-red-500 text-xs mt-1 font-bold font-tajawal">{formErrors.deliveryMethod}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-primary mb-1.5 font-tajawal">الاسم الكامل *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={`w-full p-3 rounded-lg border bg-white ${formErrors.fullName ? 'border-red-500 ring-1 ring-red-500' : 'border-divider focus:border-black focus:ring-1 focus:ring-black'} outline-none transition-all text-primary placeholder-neutral-400`}
                  placeholder="محمد بن عمر"
                />
                {formErrors.fullName && <p className="text-red-500 text-xs mt-1 font-bold font-tajawal">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-primary mb-1.5 font-tajawal">رقم الهاتف *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={`w-full p-3 rounded-lg border bg-white ${formErrors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-divider focus:border-black focus:ring-1 focus:ring-black'} outline-none transition-all text-primary placeholder-neutral-400`}
                  placeholder="0550123456"
                  dir="ltr"
                />
                {formErrors.phone && <p className="text-red-500 text-xs mt-1 font-bold font-tajawal">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-primary mb-1.5 font-tajawal">
                  {deliveryMethod === "home" ? "عنوان المنزل *" : "عنوان المكتب *"}
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  className={`w-full p-3 rounded-lg border bg-white ${formErrors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-divider focus:border-black focus:ring-1 focus:ring-black'} outline-none transition-all resize-none text-primary placeholder-neutral-400`}
                  placeholder={deliveryMethod === "home" ? "اكتب عنوان المنزل بالتفصيل" : "اكتب عنوان المكتب أو اسم المكتب والمنطقة بالتفصيل"}
                />
                {formErrors.address && <p className="text-red-500 text-xs mt-1 font-bold font-tajawal">{formErrors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-primary mb-1.5 font-tajawal">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full p-3 rounded-lg border bg-white ${formErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-divider focus:border-black focus:ring-1 focus:ring-black'} outline-none transition-all text-primary placeholder-neutral-400`}
                  placeholder="example@email.com"
                  dir="ltr"
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1 font-bold font-tajawal">{formErrors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 bg-black hover:bg-neutral-900 text-white font-bold py-4 rounded-lg transition-colors font-tajawal disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? "جاري إرسال الطلب..." : "إرسال الطلب"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
