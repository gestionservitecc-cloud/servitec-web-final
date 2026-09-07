"use client";

import { useState } from "react";
import Link from "next/link";

export function ProductImageGallery({
  images,
  name,
  showThumbnails = false,
  href,
}: {
  images: string[];
  name: string;
  showThumbnails?: boolean;
  href?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] || images[0];

  if (!selectedImage) return null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {href ? (
        <Link href={href} aria-label={`Ver detalle de ${name}`} className="block h-full w-full">
          <img
            src={selectedImage}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </Link>
      ) : (
        <img
          src={selectedImage}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )}
      {showThumbnails && images.length > 1 && (
        <div className="absolute left-3 top-3 flex gap-2" aria-label={`Fotos de ${name}`}>
          {images.slice(0, 3).map((url, imageIndex) => (
            <button
              key={`${url}-${imageIndex}`}
              type="button"
              onClick={() => setSelectedIndex(imageIndex)}
              aria-label={`Ver foto ${imageIndex + 1} de ${name}`}
              aria-pressed={selectedIndex === imageIndex}
              className={`h-12 w-12 overflow-hidden rounded border-2 shadow transition ${selectedIndex === imageIndex ? "border-primary ring-2 ring-primary/50" : "border-white/80 opacity-80 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
