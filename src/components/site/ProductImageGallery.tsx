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
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] || images[0];

  if (!selectedImage) return <div className="grid h-full min-h-32 w-full place-items-center bg-muted p-5 text-center text-sm text-muted-foreground">Imagen no disponible</div>;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {failedImages.includes(selectedImage) ? <div className="grid h-full w-full place-items-center bg-muted p-4 text-sm text-muted-foreground">Imagen no disponible</div> : href ? (
        <Link href={href} aria-label={`Ver detalle de ${name}`} className="block h-full w-full">
          <img
            src={selectedImage}
            width={800} height={800}
            onError={() => setFailedImages(current => [...current, selectedImage])}
            alt={name}
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </Link>
      ) : (
        <img
          src={selectedImage}
            width={800} height={800}
            onError={() => setFailedImages(current => [...current, selectedImage])}
          alt={name}
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      )}
      {showThumbnails && images.length > 1 && (
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto rounded-lg bg-white/90 p-2" aria-label={`Fotos de ${name}`}>
          {images.map((url, imageIndex) => (
            <button
              key={`${url}-${imageIndex}`}
              type="button"
              onClick={() => setSelectedIndex(imageIndex)}
              aria-label={`Ver foto ${imageIndex + 1} de ${name}`}
              aria-pressed={selectedIndex === imageIndex}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 shadow transition ${selectedIndex === imageIndex ? "border-primary ring-2 ring-primary/50" : "border-white/80 opacity-80 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
