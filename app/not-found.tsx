import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold">
          No encontramos esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Puede que el enlace esté roto o que la página se haya movido.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/servicios">Ver servicios</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
