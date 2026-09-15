"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import BulkUploadDialog from "@/components/admin/BulkUploadDialog";
import type { ComponentCatalogKey } from "@/lib/component-catalog";

export default function BulkUploadPageClient({
  initialCategory,
  persistent,
}: {
  initialCategory?: ComponentCatalogKey;
  persistent: boolean;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <motion.div
      initial={mounted && !reduceMotion ? { opacity: 0, y: 10 } : false}
      animate={mounted && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      <BulkUploadDialog
        persistent={persistent}
        initialCategory={initialCategory}
        onClose={() => router.push("/admin")}
        onUploaded={() => router.push("/admin")}
      />
    </motion.div>
  );
}
