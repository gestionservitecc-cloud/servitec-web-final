import { Lock } from "lucide-react";
import { signIn } from "@/auth";
import { getAssetUrl } from "@/lib/asset-url";

export function AdminLogin({ configured }: { configured: boolean }) {
  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/admin" });
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center px-4 py-6 sm:px-6">
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

        <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.10] to-white/[0.03] p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/20 text-primary">
              <Lock className="size-4" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold">Panel administrativo</h1>
              <p className="text-xs text-white/50">Acceso restringido con Google</p>
            </div>
          </div>

          {!configured ? (
            <p className="rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
              Falta configurar Google OAuth y las cuentas autorizadas.
            </p>
          ) : (
            <>
              <form action={loginWithGoogle}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Continuar con Google
                </button>
              </form>
              <p className="text-center text-xs leading-relaxed text-white/50">
                Solo las cuentas autorizadas por ServiTec pueden ingresar.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
