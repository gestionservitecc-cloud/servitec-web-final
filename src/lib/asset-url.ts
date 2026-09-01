function getEnv(name: string): string {
	const runtime = globalThis as typeof globalThis & {
		process?: { env?: Record<string, string | undefined> };
	};
	const viteEnv = (import.meta as ImportMeta & {
		env?: Record<string, string | undefined>;
	}).env;
	return runtime.process?.env?.[name] || viteEnv?.[name] || "";
}

function privateBlobPath(value: string): string | null {
	try {
		const url = new URL(value);
		if (!url.hostname.endsWith(".private.blob.vercel-storage.com")) return null;
		return url.pathname.replace(/^\/+/, "");
	} catch {
		return null;
	}
}

export function getAssetUrl(path?: string): string {
	if (!path) return "";
	const value = path.trim();
	if (!value) return "";
	const privatePath = privateBlobPath(value);
	if (privatePath) return `/api/assets/${privatePath.split("/").map(encodeURIComponent).join("/")}`;
	if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
	if (value.startsWith("/api/assets/")) return value;

	const objectPath = value.replace(/^\/+/, "");
	const blobBaseUrl = getEnv("NEXT_PUBLIC_BLOB_PUBLIC_BASE_URL").replace(/\/+$/, "");
	if (blobBaseUrl) return `${blobBaseUrl}/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
	if (objectPath.startsWith("img/")) return `/${objectPath}`;
	return `/api/assets/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
}
