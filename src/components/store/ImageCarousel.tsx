'use client';

import { useState } from 'react';

interface Props {
  images: string[];
  productName?: string;
}

export default function ImageCarousel({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const imageList = images.length > 0 ? images : ['/placeholder.png'];

  const prev = () => setActiveIndex((i) => (i === 0 ? imageList.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === imageList.length - 1 ? 0 : i + 1));

  return (
    <div className="w-full space-y-3">
      {/* Main image with arrows */}
      <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-neutral-100">
        <img
          src={imageList[activeIndex]}
          alt={productName || 'product image'}
          className="h-full w-full object-cover"
        />

        {imageList.length > 1 && (
          <>
            {/* Left arrow — previous */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition"
              aria-label="السابق"
            >
              &#8250;
            </button>

            {/* Right arrow — next */}
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition"
              aria-label="التالي"
            >
              &#8249;
            </button>
          </>
        )}

        {/* Dots */}
        {imageList.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imageList.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === activeIndex ? 'bg-black w-4' : 'bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {imageList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageList.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === activeIndex ? 'border-black' : 'border-transparent hover:border-neutral-300'
              }`}
            >
              <img src={url} alt={`thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
