"use client";

import { useMemo } from "react";
import { getAssetUrl } from "@/lib/asset-url";

export { getAssetUrl as storageObjectUrl };

export function useStorageUrl(path?: string): string {
  return useMemo(() => getAssetUrl(path), [path]);
}
