"use client";

import React from "react";
import { useRouter } from "next/navigation";
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

  return (
    <BulkUploadDialog
      persistent={persistent}
      initialCategory={initialCategory}
      onClose={() => router.push("/admin")}
      onUploaded={() => router.push("/admin")}
    />
  );
}
