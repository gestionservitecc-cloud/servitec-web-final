import React from "react";
import { redirect } from "next/navigation";
import BulkUploadPageClient from "@/components/admin/BulkUploadPageClient";
import { type ComponentCatalogKey } from "@/lib/component-catalog";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams?: { category?: string } }) {
  if (!(await isAuthed())) {
    redirect("/admin");
  }
  const category = searchParams?.category as ComponentCatalogKey | undefined;
  const persistent = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="min-h-screen bg-slate-50">
      <BulkUploadPageClient initialCategory={category} persistent={persistent} />
    </div>
  );
}
