"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Types ─── */
interface SizeEntry {
  id?: string;
  size: string;
}

interface ColorEntry {
  id?: string;
  name: string;
  value: string;
}

interface ImageEntry {
  id: number;
  url: string;
  position: number | null;
}

interface PendingCropImage {
  id: string;
  src: string;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  createdAt: string;
  sizes?: SizeEntry[];
  images?: ImageEntry[];
  colors?: ColorEntry[];
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
};

/* ─── Inline SVG Icons ─── */
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="size-16 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const SpinnerIcon = ({ className = "size-5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/* ─── Component ─── */
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  /* slide-over */
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  /* form */
  const [form, setForm] = useState(EMPTY_FORM);
  const [sizes, setSizes] = useState<SizeEntry[]>([]);
  const [colors, setColors] = useState<ColorEntry[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<PendingCropImage[]>([]);
  const [currentCrop, setCurrentCrop] = useState<PendingCropImage | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropDrag, setCropDrag] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    cropX: number;
    cropY: number;
  } | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);

  /* delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  /* toasts */
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  /* ─── Fetch products ─── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data);
    } catch {
      pushToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchProducts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProducts]);

  /* ─── Open panel (add / edit) ─── */
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSizes([]);
    setColors([]);
    setImages([]);
    setPanelOpen(true);
  };

  const openEdit = async (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      imageUrl: product.imageUrl ?? "",
    });
    /* fetch full product to get sizes */
    try {
      const res = await fetch(`/api/products/${product.id}`);
      if (res.ok) {
        const full = await res.json();
        setSizes(
          Array.isArray(full.sizes)
            ? full.sizes.map((s: { id?: number; size: string }, i: number) => ({
                id: s.id?.toString() || `size-${i}`,
                size: s.size,
              }))
            : []
        );
        setImages(
          Array.isArray(full.images)
            ? full.images.map((img: { url: string }) => img.url)
            : full.imageUrl ? [full.imageUrl] : []
        );
        setColors(
          Array.isArray(full.colors)
            ? full.colors.map((color: { id?: number; name: string; value: string }, i: number) => ({
                id: color.id?.toString() || `color-${i}`,
                name: color.name,
                value: color.value,
              }))
            : []
        );
      } else {
        setSizes([]);
        setColors([]);
      }
    } catch {
      setSizes([]);
      setColors([]);
      setImages([]);
    }
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
  };

  /* ─── Form handlers ─── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const addSize = () => setSizes((s) => [...s, { id: `new-${Date.now()}-${Math.random()}`, size: "" }]);
  const removeSize = (idx: number) => setSizes((s) => s.filter((_, i) => i !== idx));
  const updateSize = (idx: number, field: keyof SizeEntry, value: string) =>
    setSizes((s) => s.map((entry, i) => (i === idx ? { ...entry, [field]: value } : entry)));
  const addColor = () => setColors((c) => [...c, { id: `color-${Date.now()}-${Math.random()}`, name: "", value: "#000000" }]);
  const removeColor = (idx: number) => setColors((c) => c.filter((_, i) => i !== idx));
  const updateColor = (idx: number, field: keyof ColorEntry, value: string) =>
    setColors((c) => c.map((entry, i) => (i === idx ? { ...entry, [field]: value } : entry)));

  /* ─── Submit (create / update) ─── */
  const resetCropControls = () => {
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setCropDrag(null);
  };

  const clampCropPosition = (value: number) => Math.max(-100, Math.min(100, value));
  const clampCropZoom = (value: number) => Math.max(1, Math.min(2.5, value));

  const handleCropPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setCropDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cropX,
      cropY,
    });
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!cropDrag || cropDrag.pointerId !== event.pointerId) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const deltaX = ((event.clientX - cropDrag.startX) / rect.width) * 160;
    const deltaY = ((event.clientY - cropDrag.startY) / rect.height) * 160;
    setCropX(clampCropPosition(cropDrag.cropX + deltaX));
    setCropY(clampCropPosition(cropDrag.cropY + deltaY));
  };

  const handleCropPointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (cropDrag?.pointerId === event.pointerId) {
      setCropDrag(null);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleImageFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const pendingImages = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          src: await readFileAsDataUrl(file),
          name: file.name,
        }))
      );

      setCropQueue(pendingImages.slice(1));
      setCurrentCrop(pendingImages[0]);
      resetCropControls();
    } catch {
      pushToast("Failed to read image", "error");
    }
  };

  const closeCropModal = () => {
    setCurrentCrop(null);
    setCropQueue([]);
    resetCropControls();
  };

  const loadImageElement = useCallback((src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    }), []);

  const drawCropToCanvas = useCallback(async (canvas: HTMLCanvasElement, src: string, outputSize: number) => {
    const image = await loadImageElement(src);
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputSize, outputSize);

    const baseScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight);
    const scale = baseScale * cropZoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (drawWidth - outputSize) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - outputSize) / 2);
    const drawX = (outputSize - drawWidth) / 2 + (cropX / 100) * maxOffsetX;
    const drawY = (outputSize - drawHeight) / 2 + (cropY / 100) * maxOffsetY;

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }, [cropX, cropY, cropZoom, loadImageElement]);

  const buildCroppedImage = async (src: string) => {
    const canvas = document.createElement("canvas");
    await drawCropToCanvas(canvas, src, 1200);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  useEffect(() => {
    const canvas = cropCanvasRef.current;
    if (!canvas || !currentCrop) return;

    drawCropToCanvas(canvas, currentCrop.src, 800).catch(() => {
      pushToast("Failed to preview image crop", "error");
    });
  }, [currentCrop, drawCropToCanvas, pushToast]);

  const confirmCropUpload = async () => {
    if (!currentCrop) return;

    setImageUploading(true);
    try {
      const croppedBase64 = await buildCroppedImage(currentCrop.src);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: croppedBase64 }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setImages((prev) => [...prev, data.url]);

      const [nextImage, ...remainingImages] = cropQueue;
      if (nextImage) {
        setCurrentCrop(nextImage);
        setCropQueue(remainingImages);
        resetCropControls();
      } else {
        setCurrentCrop(null);
        setCropQueue([]);
        resetCropControls();
        pushToast("Image uploaded", "success");
      }
    } catch {
      pushToast("Failed to upload image", "error");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;

    setSubmitting(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      imageUrl: images[0] || form.imageUrl.trim() || null,
      sizes: sizes
        .filter((s) => s.size.trim())
        .map((s) => ({
          size: s.size.trim(),
        })),
      colors: colors
        .filter((color) => color.name.trim() || color.value)
        .map((color) => ({
          name: color.name.trim() || color.value || "Color",
          value: color.value || "#000000",
        })),
      images: images.map((url, i) => ({ url, position: i })),
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      pushToast(editingId ? "Product updated" : "Product created", "success");
      closePanel();
      fetchProducts();
    } catch {
      pushToast(editingId ? "Failed to update product" : "Failed to create product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete ─── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      pushToast("Product deleted", "success");
      fetchProducts();
    } catch {
      pushToast("Failed to delete product", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ─── Helpers ─── */
  const fmtPrice = (p: string) => `${parseFloat(p).toFixed(2)} DA`;

  const inputClass =
    "w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-colors";

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Toasts ── */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-5 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-md animate-[slideIn_0.3s_ease] ${
              t.type === "success"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Products</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your product catalog</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 transition-all cursor-pointer"
          >
            <PlusIcon />
            Add Product
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <SpinnerIcon className="size-8 text-amber-500" />
          </div>
        ) : products.length === 0 ? (
          /* empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <PackageIcon />
            <h3 className="mt-4 text-lg font-semibold text-slate-300">No products yet</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by adding your first product.</p>
            <button
              onClick={openAdd}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 transition-all cursor-pointer"
            >
              <PlusIcon />
              Add Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-slate-700/60 transition-all duration-300 flex flex-col group"
              >
                {/* Product Image */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-800/60">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-700">
                      <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 min-h-[2rem]">
                      {p.description || "No description provided."}
                    </p>
                    
                    {/* Sizes badges */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.sizes && p.sizes.length > 0 ? (
                        p.sizes.map((s) => (
                          <span
                            key={s.size}
                            className="inline-flex items-center rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-800/60"
                          >
                            {s.size}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">No sizes registered</span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.colors && p.colors.length > 0 && (
                        <span className="inline-flex items-center rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-800/60">
                          {p.colors.length} color{p.colors.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/40 flex items-center justify-between">
                    <span className="text-base font-bold text-white tracking-tight">
                      {fmtPrice(p.price)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all cursor-pointer"
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Slide-over Panel ── */}
      {panelOpen && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
            onClick={closePanel}
          />

          {/* panel */}
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease]">
            {/* panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? "Edit Product" : "New Product"}
              </h2>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XIcon />
              </button>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Name <span className="text-rose-400">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Product name"
                  className={inputClass}
                />
              </div>

              {/* description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Short description…"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* price */}
              <div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Price <span className="text-rose-400">*</span>
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* image upload — multi-image */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Product Images</label>
                {/* Preview grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {images.map((url, idx) => (
                      <div
                        key={url + idx}
                        onClick={() => setPreviewImage(url)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setPreviewImage(url);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        className="relative rounded-xl overflow-hidden border border-slate-800/60 aspect-square bg-slate-950 group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-amber-500/70"
                        aria-label={`Preview image ${idx + 1}`}
                      >
                        <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                        {/* Primary badge */}
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            رئيسية
                          </span>
                        )}
                        {/* Action buttons */}
                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                          {/* Move up */}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setImages((prev) => {
                                  const next = [...prev];
                                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                  return next;
                                });
                              }}
                              className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-950/80 text-slate-300 hover:text-white backdrop-blur-sm border border-slate-800/60 cursor-pointer"
                              title="Move up"
                            >
                              <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                          )}
                          {/* Move down */}
                          {idx < images.length - 1 && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setImages((prev) => {
                                  const next = [...prev];
                                  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                  return next;
                                });
                              }}
                              className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-950/80 text-slate-300 hover:text-white backdrop-blur-sm border border-slate-800/60 cursor-pointer"
                              title="Move down"
                            >
                              <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          )}
                          {/* Remove */}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setImages((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-950/80 text-rose-400 hover:text-rose-300 backdrop-blur-sm border border-slate-800/60 cursor-pointer [&_svg]:size-3"
                            title="Remove image"
                          >
                            <XIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <label
                  className={`flex items-center justify-center gap-2 w-full rounded-xl border border-dashed px-4 py-4 text-sm transition-colors cursor-pointer ${
                    imageUploading
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-400"
                      : "border-slate-800 bg-slate-950/80 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                  }`}
                >
                  {imageUploading ? (
                    <>
                      <SpinnerIcon className="size-4" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      إضافة صورة
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={imageUploading}
                    onChange={async (e) => {
                      await handleImageFilesSelected(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {/* sizes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">Sizes</label>
                  <button
                    type="button"
                    onClick={addSize}
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <PlusIcon />
                    Add size
                  </button>
                </div>
                {sizes.length === 0 && (
                  <p className="text-xs text-slate-600 italic">No sizes added.</p>
                )}
                <div className="space-y-2">
                  {sizes.map((s, idx) => (
                    <div key={s.id || idx} className="flex items-center gap-2">
                      <input
                        value={s.size}
                        onChange={(e) => updateSize(idx, "size", e.target.value)}
                        placeholder="Size (e.g. M)"
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => removeSize(idx)}
                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                      >
                        <XIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* colors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">Colors</label>
                  <button
                    type="button"
                    onClick={addColor}
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <PlusIcon />
                    Add color
                  </button>
                </div>
                {colors.length === 0 && (
                  <p className="text-xs text-slate-600 italic">No colors added. Buyers will not see a color selector.</p>
                )}
                <div className="space-y-2">
                  {colors.map((color, idx) => (
                    <div key={color.id || idx} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={color.value || "#000000"}
                          onChange={(e) => updateColor(idx, "value", e.target.value)}
                          className="h-11 w-14 shrink-0 rounded-lg border border-slate-800 bg-slate-950 p-1 cursor-pointer"
                          aria-label="Color value"
                        />
                        <input
                          value={color.name}
                          onChange={(e) => updateColor(idx, "name", e.target.value)}
                          placeholder="Color name (e.g. Black, White, Navy)"
                          className={`${inputClass} min-w-0 flex-1`}
                        />
                        <button
                          type="button"
                          onClick={() => removeColor(idx)}
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                          aria-label="Remove color"
                        >
                          <XIcon />
                        </button>
                      </div>
                      <input
                        value={color.value}
                        onChange={(e) => updateColor(idx, "value", e.target.value)}
                        placeholder="#000000"
                        className={`${inputClass} mt-2 w-full font-mono text-xs`}
                        dir="ltr"
                        aria-label="Color hex value"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* panel footer */}
            <div className="border-t border-slate-800/60 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closePanel}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  /* programmatically submit the form */
                  const formEl = document.querySelector<HTMLFormElement>("aside form");
                  if (formEl) formEl.requestSubmit();
                }}
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting && <SpinnerIcon className="size-4" />}
                {editingId ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {currentCrop && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="flex max-h-[96vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Frame image</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {currentCrop.name}
                  {cropQueue.length > 0 ? ` • ${cropQueue.length} more` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="Cancel image crop"
              >
                <XIcon />
              </button>
            </div>

            <div className="min-h-0 space-y-4 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
              <canvas
                ref={cropCanvasRef}
                className="mx-auto aspect-square w-[min(100%,calc(100vw-2rem))] max-w-sm touch-none rounded-xl border border-slate-800 bg-slate-900 cursor-grab active:cursor-grabbing"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerEnd}
                onPointerCancel={handleCropPointerEnd}
                aria-label="Crop preview"
              />

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCropZoom((value) => clampCropZoom(value - 0.1))}
                  disabled={imageUploading}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xl font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  aria-label="Zoom out"
                >
                  -
                </button>
                <span className="min-w-16 text-center text-xs font-medium text-slate-400">
                  {Math.round(cropZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setCropZoom((value) => clampCropZoom(value + 0.1))}
                  disabled={imageUploading}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xl font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-800 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <button
                type="button"
                onClick={resetCropControls}
                disabled={imageUploading}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-colors"
              >
                Reset
              </button>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCropModal}
                  disabled={imageUploading}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCropUpload}
                  disabled={imageUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {imageUploading && <SpinnerIcon className="size-4" />}
                  {cropQueue.length > 0 ? "Upload & next" : "Upload image"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/50 p-2 text-white hover:bg-white/10 transition-colors"
            aria-label="Close image preview"
          >
            <XIcon />
          </button>
          <img
            src={previewImage}
            alt="Product image preview"
            className="max-h-[92vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-[scaleIn_0.2s_ease]">
              <h3 className="text-lg font-semibold text-white">Delete Product</h3>
              <p className="mt-2 text-sm text-slate-400">
                Are you sure you want to delete{" "}
                <span className="font-medium text-slate-200">{deleteTarget.name}</span>? This action
                cannot be undone.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
