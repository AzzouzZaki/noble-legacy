"use client";

import React, { useState, useEffect, useRef } from "react";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import ImageCarousel from "@/components/store/ImageCarousel";
import ZimouOfficeSelect, {
  ZimouDeliveryChoice,
} from "@/components/store/ZimouOfficeSelect";

interface SizeEntry {
  id: number;
  size: string;
  stock: number;
}

interface ProductImage {
  id: number;
  url: string;
  position: number | null;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number | null;
  imageUrl: string | null;
  sizes: SizeEntry[];
  images?: ProductImage[];
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Validation & status states
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Order form visibility
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Form states
  const [deliveryType, setDeliveryType] = useState<"home" | "pickup">("home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<ZimouDeliveryChoice | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const orderFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setProduct(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch product:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Details Skeleton */}
          <div className="space-y-6 order-2 md:order-1">
            <div className="h-10 bg-neutral-100 rounded w-3/4" />
            <div className="h-6 bg-neutral-100 rounded w-1/4" />
            <div className="h-24 bg-neutral-100 rounded w-full" />
            <div className="h-12 bg-neutral-100 rounded w-1/2" />
          </div>
          {/* Image Skeleton */}
          <div className="aspect-square bg-neutral-100 rounded-xl order-1 md:order-2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-bold text-primary font-tajawal">المنتج غير موجود</h2>
        <p className="text-muted-text mt-2 font-tajawal">عذراً، المنتج الذي تبحث عنه غير متوفر أو تم حذفه.</p>
      </div>
    );
  }

  const priceValue = parseFloat(product.price || "0");
  const formattedPrice = `${priceValue.toFixed(0)} دج`;
  const deliveryPrice = selectedDelivery?.price ?? 0;
  const productTotal = priceValue * quantity;
  const orderTotal = productTotal + deliveryPrice;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError("يرجى اختيار المقاس أولاً");
      return;
    }
    setSizeError(null);

    addToCart({
      productId: product.id,
      name: product.name,
      price: priceValue,
      size: selectedSize,
      quantity: quantity,
      imageUrl: product.imageUrl || undefined,
    });

    // Notify header cart icon count
    window.dispatchEvent(new Event("cart-updated"));

    // Show inline success message
    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 2000);
  };

  const handleOrderNowClick = () => {
    if (!selectedSize) {
      setSizeError("يرجى اختيار المقاس أولاً");
      return;
    }
    setSizeError(null);
    setShowOrderForm(true);
    // Scroll to form smoothly after it renders
    setTimeout(() => orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleQtyChange = (val: number) => {
    if (val < 1) return;
    setQuantity(val);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSize) {
      setSizeError("يرجى اختيار المقاس أولاً");
      orderFormRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSizeError(null);

    // Validate form fields
    const errors: { [key: string]: string } = {};
    if (!fullName.trim()) errors.fullName = "الاسم الكامل مطلوب";
    if (!phone.trim()) errors.phone = "رقم الهاتف مطلوب";
    if (!selectedDelivery) errors.delivery = "يرجى اختيار تفاصيل التوصيل";
    if (deliveryType === "home" && !address.trim()) {
      errors.address = "العنوان مطلوب لتوصيل المنزل";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormSubmitting(true);
    setOrderError(null);

    // Prepare address string
    const deliveryDetails = selectedDelivery
      ? `التوصيل: ${selectedDelivery.label} - ${selectedDelivery.communeName}, ${selectedDelivery.wilayaName} - سعر التوصيل: ${formatPrice(selectedDelivery.price)}`
      : "";
    const finalAddress =
      deliveryType === "home"
        ? `عنوان المنزل: ${address} - ${deliveryDetails}`
        : `استلام من مكتب التوصيل - ${deliveryDetails}`;

    const payload = {
      customerName: fullName,
      customerPhone: phone,
      shippingAddress: finalAddress,
      totalAmount: String(orderTotal),
      items: [
        {
          productId: product.id,
          size: selectedSize,
          quantity: quantity,
          unitPrice: String(priceValue),
        },
      ],
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create order");
      }

      setOrderSuccess(true);
      // Reset form
      setFullName("");
      setPhone("");
      setAddress("");
      setSelectedDelivery(null);
      setSelectedSize(null);
      setQuantity(1);
    } catch (err) {
      console.error(err);
      setOrderError("حدث خطأ، يرجى المحاولة مجدداً.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16 min-h-screen">
      
      {/* Two-Column Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        
        {/* Right Side: Product Image Carousel */}
        <div className="w-full order-1 md:order-2">
          <ImageCarousel
            images={
              product.images && product.images.length > 0
                ? product.images.map((img) => img.url)
                : product.imageUrl
                  ? [product.imageUrl]
                  : []
            }
          />
        </div>

        {/* Left Side: Product Details & Selection */}
        <div className="flex flex-col justify-start space-y-8 order-2 md:order-1">
          <div>
            <h1 className="text-3xl font-extrabold text-primary font-tajawal">{product.name}</h1>
            <p className="text-2xl font-bold text-black mt-2 font-tajawal">
              {formattedPrice}
            </p>
          </div>

          {product.description && (
            <div className="border-t border-b border-divider py-6">
              <h2 className="text-sm font-bold text-primary mb-2 font-tajawal">الوصف</h2>
              <p className="text-sm leading-relaxed text-muted-text whitespace-pre-line font-tajawal">
                {product.description}
              </p>
            </div>
          )}

          {/* Size Selector */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-primary font-tajawal">المقاس</span>
              {sizeError && (
                <span className="text-xs font-semibold text-red-600 font-tajawal bg-red-50 px-2.5 py-1 rounded">
                  {sizeError}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {product.sizes && product.sizes.length > 0 ? (
                product.sizes.map((s) => {
                  const isOutOfStock = s.stock <= 0;
                  const isSelected = selectedSize === s.size;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (isOutOfStock) return;
                        setSelectedSize(s.size);
                        setSizeError(null);
                      }}
                      disabled={isOutOfStock}
                      className={`
                        min-w-[3.5rem] h-11 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-150 cursor-pointer font-tajawal
                        ${isOutOfStock ? "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed line-through" : ""}
                        ${
                          !isOutOfStock && isSelected
                            ? "bg-black text-white border border-black"
                            : ""
                        }
                        ${
                          !isOutOfStock && !isSelected
                            ? "bg-white text-black border border-black hover:bg-neutral-50"
                            : ""
                        }
                      `}
                    >
                      {s.size}
                      {s.stock > 0 && s.stock <= 5 && (
                        <span className="block text-[8px] font-normal leading-none mt-0.5">
                          (متبقي {s.stock})
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-red-500 font-tajawal">نفذت جميع المقاسات لهذا المنتج</p>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <span className="text-sm font-bold text-primary block mb-3 font-tajawal">الكمية</span>
            <div className="flex items-center space-x-reverse space-x-3 w-32 border border-black rounded-lg p-1.5 bg-white">
              <button
                type="button"
                onClick={() => handleQtyChange(quantity - 1)}
                className="w-8 h-8 flex items-center justify-center text-xl font-bold text-primary hover:bg-neutral-100 rounded transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="flex-1 text-center font-bold text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => handleQtyChange(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-xl font-bold text-primary hover:bg-neutral-100 rounded transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="space-y-4 pt-4 border-t border-divider">
            {/* Button 1: Add to Cart */}
            <div className="relative">
              <button
                onClick={handleAddToCart}
                className="w-full bg-white hover:bg-neutral-50 text-black border-2 border-black text-base font-bold py-4 rounded-lg transition-colors duration-200 cursor-pointer font-tajawal flex items-center justify-center gap-2"
              >
                إضافة إلى السلة
              </button>
              {cartSuccess && (
                <div className="absolute inset-0 bg-neutral-900 text-white font-bold py-4 rounded-lg flex items-center justify-center text-base animate-pulse">
                  تمت الإضافة إلى السلة ✓
                </div>
              )}
            </div>

            {/* Button 2: Order Now */}
            <button
              onClick={handleOrderNowClick}
              className="w-full bg-black hover:bg-neutral-900 text-white text-base font-bold py-4 rounded-lg transition-colors duration-200 cursor-pointer font-tajawal"
            >
              اطلب الآن
            </button>
          </div>
        </div>
      </div>

      {/* Order Form Section — shown only after clicking Order Now */}
      {showOrderForm && (
        <div
          ref={orderFormRef}
          id="order-form"
          className="pt-16 border-t border-divider max-w-3xl mx-auto animate-fade-up"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-primary font-tajawal">
              أكمل طلبك
            </h2>
            <button
              type="button"
              onClick={() => setShowOrderForm(false)}
              className="text-muted-text hover:text-primary transition-colors text-sm font-medium font-tajawal flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              إغلاق
            </button>
          </div>

          {orderSuccess ? (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-8 text-center space-y-4 shadow-sm">
              <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-bold font-tajawal">
                ✓ تم استلام طلبك بنجاح! سنتواصل معك قريباً.
              </p>
              <button
                onClick={() => { setOrderSuccess(false); setShowOrderForm(false); }}
                className="mt-2 text-sm text-green-700 underline font-semibold font-tajawal"
              >
                طلب منتج آخر أو مقاس جديد
              </button>
            </div>
          ) : (
            <form onSubmit={handleOrderSubmit} className="space-y-6">
              
              {orderError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm font-medium font-tajawal">
                  {orderError}
                </div>
              )}

              {/* Delivery Type Toggle */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-primary block font-tajawal">
                  طريقة التوصيل
                </label>
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Home Delivery Card */}
                  <div
                    onClick={() => {
                      setDeliveryType("home");
                      setSelectedDelivery(null);
                    }}
                    className={`
                      border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-white
                      ${deliveryType === "home" ? "border-black shadow-sm" : "border-neutral-200 hover:border-neutral-300"}
                    `}
                  >
                    <span className="text-2xl">🏠</span>
                    <span className="text-sm font-bold font-tajawal">توصيل للمنزل</span>
                  </div>

                  {/* Pickup Card */}
                  <div
                    onClick={() => {
                      setDeliveryType("pickup");
                      setSelectedDelivery(null);
                    }}
                    className={`
                      border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-white
                      ${deliveryType === "pickup" ? "border-black shadow-sm" : "border-neutral-200 hover:border-neutral-300"}
                    `}
                  >
                    <span className="text-2xl">🏢</span>
                    <span className="text-sm font-bold font-tajawal">استلام من مكتب التوصيل</span>
                  </div>

                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-bold text-primary block font-tajawal">
                  الاسم الكامل
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`
                    w-full bg-white border rounded-lg px-4 py-3 text-sm text-primary placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all
                    ${formErrors.fullName ? "border-red-500 ring-1 ring-red-500" : "border-neutral-300"}
                  `}
                  placeholder="محمد بن عمر"
                />
                {formErrors.fullName && (
                  <span className="text-xs font-semibold text-red-600 block mt-1 font-tajawal">
                    {formErrors.fullName}
                  </span>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-bold text-primary block font-tajawal">
                  رقم الهاتف
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`
                    w-full bg-white border rounded-lg px-4 py-3 text-sm text-primary placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all
                    ${formErrors.phone ? "border-red-500 ring-1 ring-red-500" : "border-neutral-300"}
                  `}
                  placeholder="0550123456"
                />
                {formErrors.phone && (
                  <span className="text-xs font-semibold text-red-600 block mt-1 font-tajawal">
                    {formErrors.phone}
                  </span>
                )}
              </div>

              {/* Delivery company / office selector — always shown first */}
              <ZimouOfficeSelect
                mode={deliveryType === "home" ? "home" : "office"}
                selectedChoice={selectedDelivery}
                onSelectChoice={(choice) => {
                  setSelectedDelivery(choice);
                  setFormErrors((prev) => ({ ...prev, delivery: "" }));
                }}
                error={formErrors.delivery}
              />

              {/* Address — only for home delivery, shown AFTER delivery is chosen */}
              {deliveryType === "home" && selectedDelivery && (
                <div className="space-y-2 animate-fade-up">
                  <label htmlFor="address" className="text-sm font-bold text-primary block font-tajawal">
                    عنوان المنزل التفصيلي
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`
                      w-full bg-white border rounded-lg px-4 py-3 text-sm text-primary placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all resize-none
                      ${formErrors.address ? "border-red-500 ring-1 ring-red-500" : "border-neutral-300"}
                    `}
                    placeholder="حي 5 جويلية، عمارة 3، شقة 10"
                  />
                  {formErrors.address && (
                    <span className="text-xs font-semibold text-red-600 block mt-1 font-tajawal">
                      {formErrors.address}
                    </span>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="rounded-lg border border-divider bg-neutral-50 p-4 space-y-2 font-tajawal">
                <div className="flex justify-between text-sm text-muted-text">
                  <span>المجموع الفرعي</span>
                  <span className="font-bold text-primary">{formatPrice(productTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-text">
                  <span>سعر التوصيل</span>
                  <span className="font-bold text-primary">{formatPrice(deliveryPrice)}</span>
                </div>
                <div className="flex justify-between border-t border-divider pt-2 text-base font-extrabold text-primary">
                  <span>الإجمالي</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-black hover:bg-neutral-900 text-white font-bold py-4 rounded-lg transition-colors duration-200 cursor-pointer disabled:opacity-50 font-tajawal text-center flex items-center justify-center"
              >
                {formSubmitting ? "جاري تأكيد طلبك..." : "تأكيد الطلب"}
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
