import React from "react";
import BulkUploadPageClient from "@/components/admin/BulkUploadPageClient";
import { type ComponentCatalogKey } from "@/lib/component-catalog";

export const dynamic = "force-dynamic";

export default function Page({ searchParams }: { searchParams?: { category?: string } }) {
  const category = searchParams?.category as ComponentCatalogKey | undefined;
  const persistent = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="min-h-screen bg-slate-50">
      <BulkUploadPageClient initialCategory={category} persistent={persistent} />
    </div>
  );
}
