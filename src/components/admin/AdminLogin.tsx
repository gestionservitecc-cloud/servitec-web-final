"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { getAssetUrl } from "@/lib/asset-url";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión.");
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("servitec-admin-user", email || "admin@servitec.com");
      }
      router.refresh();
    } catch {
      setError("Error de red. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/10 p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getAssetUrl("logo.png")} alt="ServiTec" className="h-full w-full object-contain" />
          </div>
          <p className="text-xl font-black tracking-tight">
            Servi<span className="text-primary">Tec</span>
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8"
        >
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/20 text-primary">
              <Lock className="size-4" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold">Panel administrativo</h1>
              <p className="text-xs text-white/50">Acceso restringido</p>
            </div>
          </div>

          {!configured ? (
            <p className="rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
              El panel todavía no está configurado.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="text-xs text-white/60">
                  Gmail o email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="text-xs text-white/60">
                  Contraseña
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Ingresando…" : "Ingresar"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
