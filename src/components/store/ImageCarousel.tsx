'use client';

import { useRef, useState } from 'react';

interface Props {
  images: string[];
  productName?: string;
}

export default function ImageCarousel({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLImageElement | null)[]>([]);
  const imageList = images.length > 0 ? images : ['/placeholder.png'];
  const visibleIndex = Math.min(activeIndex, imageList.length - 1);

  const scrollToIndex = (index: number) => {
    const nextIndex = (index + imageList.length) % imageList.length;

    setActiveIndex(nextIndex);
    slideRefs.current[nextIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  const prev = () => scrollToIndex(visibleIndex - 1);
  const next = () => scrollToIndex(visibleIndex + 1);

  const handleScroll = () => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const scrollerCenter = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
    const nextIndex = slideRefs.current.reduce((closestIndex, slide, index) => {
      if (!slide) return closestIndex;

      const slideRect = slide.getBoundingClientRect();
      const slideCenter = slideRect.left + slideRect.width / 2;
      const closestSlide = slideRefs.current[closestIndex];
      if (!closestSlide) return index;

      const closestRect = closestSlide.getBoundingClientRect();
      const closestCenter = closestRect.left + closestRect.width / 2;
      return Math.abs(slideCenter - scrollerCenter) < Math.abs(closestCenter - scrollerCenter)
        ? index
        : closestIndex;
    }, 0);

    if (nextIndex !== visibleIndex && nextIndex >= 0 && nextIndex < imageList.length) {
      setActiveIndex(nextIndex);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Main image with arrows */}
      <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-neutral-100">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {imageList.map((url, i) => (
            <img
              key={`${url}-${i}`}
              ref={(element) => {
                slideRefs.current[i] = element;
              }}
              src={url}
              alt={productName || 'product image'}
              draggable={false}
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>

        {imageList.length > 1 && (
          <>
            {/* Left arrow — previous */}
            <button
              onClick={next}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition"
              aria-label="السابق"
            >
              &#8250;
            </button>

            {/* Right arrow — next */}
            <button
              onClick={prev}
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
                onClick={() => scrollToIndex(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === visibleIndex ? 'bg-black w-4' : 'bg-white/70'
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
              onClick={() => scrollToIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === visibleIndex ? 'border-black' : 'border-transparent hover:border-neutral-300'
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
