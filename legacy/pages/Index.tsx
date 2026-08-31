import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReviewsSection from "@/components/ReviewsSection";
import StorageImage from "@/components/StorageImage";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Smartphone,
  Cpu,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Shield,
} from "lucide-react";

interface FeaturedStockItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  href: string;
}

const resolveImage = (path?: string) => {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "servitec-web"}/o/${encodeURIComponent(path.replace(/^\//, ""))}?alt=media`;
};

const Index = () => {
  const [featuredItems, setFeaturedItems] = useState<FeaturedStockItem[]>([]);
  const [recommendedPcs, setRecommendedPcs] = useState<FeaturedStockItem[]>([]);

  useEffect(() => {
    const mapItem = (item: Record<string, unknown>) => {
      const raw = item as {
        id?: string;
        nombre?: string;
        name?: string;
        categoria?: string;
        category?: string;
        precio?: number | string;
        price?: number | string;
        original?: number | string;
        promo?: number | string;
        imagen?: string;
        image?: string;
        recomendada?: boolean;
      };
      const categoryValue = String(raw.categoria || raw.category || "").trim().toLowerCase();
      const name = raw.nombre || raw.name || "Producto";
      const price = Number(raw.precio ?? raw.price ?? raw.promo ?? raw.original ?? 0);
      const image = resolveImage(raw.imagen || raw.image || "");
      const id = raw.id || `${categoryValue}-${name}`;

      if (!name || !Number.isFinite(price) || price <= 0) return null;

      return {
        id,
        name,
        category: categoryValue,
        price,
        image,
        href: categoryValue === "pc-armada" ? "/stock?categoria=pc-armada" : "/stock?categoria=notebook",
      } satisfies FeaturedStockItem;
    };

    const unsubEquipos = onSnapshot(collection(db, "equipos_stock"), (snapshot) => {
      const items = snapshot.docs
        .map((doc) => mapItem({ id: doc.id, ...doc.data() }))
        .filter((item): item is FeaturedStockItem => Boolean(item));

      const uniqueMap = new Map<string, FeaturedStockItem>();
      items.forEach((item) => uniqueMap.set(item.id, item));

      const allItems = [...uniqueMap.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
      const notebooks = allItems.filter((item) => item.category === "notebook").slice(0, 4);
      const recommended = allItems.filter((item) => item.category === "pc-armada" && Boolean(snapshot.docs.find((doc) => doc.id === item.id)?.data().recomendada)).slice(0, 4);

      setFeaturedItems(notebooks);
      setRecommendedPcs(recommended);
    });

    return () => {
      unsubEquipos();
    };
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-secondary/30 py-16 text-background sm:py-20 md:py-32">
        <StorageImage
          storagePath="BAN-IN.png"
          alt="Descripción"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl md:text-7xl">
            Expertos en darle vida a tus{" "}
            <span className="text-primary">dispositivos</span>
          </h1>
          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <Button size="lg" variant="secondary" asChild className="h-12 w-full sm:w-auto sm:min-w-[180px]">
              <Link to="/servicios" className="flex items-center justify-center gap-2 text-sm sm:text-base">
                Ver Servicios <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 w-full border-background/30 bg-background/10 text-background hover:bg-background/20 hover:text-background sm:w-auto sm:min-w-[180px]" asChild>
              <Link to="/armar-pc" className="flex items-center justify-center gap-2 text-sm sm:text-base">
                Armá tu PC <ArrowRight size={18} />
              </Link>
            </Button>
            <Button
              size="lg"
              className="h-12 w-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 sm:w-auto sm:min-w-[220px]"
              asChild
            >
              <a
                href="https://wa.me/5491124873190"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <MessageCircle size={18} /> WhatsApp Directo
              </a>
            </Button>
          </div>
        </div>
      </section>
      <section className="bg-slate-50 py-8 md:py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stock</p>
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">PC Armada</h2>
            </div>
            <Link to="/stock?categoria=pc-armada" className="text-sm font-semibold text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          {recommendedPcs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recommendedPcs.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-b from-red-50 to-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    <h3 className="min-h-[48px] text-sm font-semibold leading-snug text-slate-900 sm:min-h-[56px] sm:text-base">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-slate-900 sm:text-2xl">${item.price.toLocaleString()}</span>
                    </div>
                    <Button asChild className="h-10 w-full rounded-full bg-secondary text-slate-950 hover:bg-secondary/90 sm:h-11">
                      <Link to={item.href} className="text-sm">Ver más</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-red-200 bg-white p-8 text-center text-slate-500">
              Cargando configuraciones recomendadas...
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-50 py-8 md:py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stock</p>
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Notebooks</h2>
            </div>
            <Link to="/stock?categoria=notebook" className="text-sm font-semibold text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          {featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featuredItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    <h3 className="min-h-[48px] text-sm font-semibold leading-snug text-slate-900 sm:min-h-[56px] sm:text-base">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-slate-900 sm:text-2xl">${item.price.toLocaleString()}</span>
                    </div>
                    <Button asChild className="h-10 w-full rounded-full bg-primary text-white hover:bg-primary/90 sm:h-11">
                      <Link to={item.href} className="text-sm">Ver más</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Cargando notebooks...
            </div>
          )}
        </div>
      </section>

      <section className="py-14 md:py-20 bg-slate-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-stretch">
            {/* ================= IZQUIERDA ================= */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 sm:p-12 md:p-16 text-white">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary shadow-sm w-fit">
                  <Sparkles size={16} className="animate-pulse" />
                  Soporte Técnico de Alta Gama
                </div>

                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                  ¿Tu equipo calienta o <br className="hidden sm:block" />
                  <span className="text-primary">funciona lento?</span>
                </h2>

                <p className="max-w-lg text-base sm:text-lg text-slate-300">
                  No esperes a que sea tarde. Nuestra{" "}
                  <strong>Mantenimiento & Limpieza Premium</strong> recupera la
                  vida útil de tus dispositivos.
                </p>

                <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
                  {[
                    "Notebooks",
                    "MacBooks",
                    "PC Gamer",
                    "Consolas",
                    "All-in-One",
                  ].map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-400"
                    >
                      • {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-full px-8 py-6 text-base sm:text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    asChild
                  >
                    <a
                      href="https://wa.me/5491124873190?text=Hola,%20necesito%20un%20Service%20Premium"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      ¡Quiero mi service ahora! <ArrowRight size={20} />
                    </a>
                  </Button>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  ✅ Presupuesto sin cargo • ⚡ Entrega en 24/48hs
                </p>
              </div>
            </div>

            {/* ================= DERECHA ================= */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white sm:p-12 md:p-16">
              <div className="absolute inset-0 bg-slate-950/55" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
                  <Cpu size={16} /> Nueva función
                </div>

                <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                  Armá tu PC a tu <span className="text-primary">medida</span>
                </h2>

                <p className="max-w-lg text-base text-slate-300 sm:text-lg">
                  Elegí componentes compatibles, calculá el consumo y creá una
                  configuración pensada para jugar, trabajar o crear.
                </p>

                <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
                  {["Gaming", "Oficina", "Componentes compatibles", "Consumo estimado"].map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400"
                    >
                      • {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 sm:w-auto sm:text-lg"
                    asChild
                  >
                    <Link to="/armar-pc" className="flex items-center justify-center gap-2">
                      Empezar a armarla <ArrowRight size={20} />
                    </Link>
                  </Button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Configuración personalizada • Lista para elegir
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection />

      {/* Contact Form */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-2xl bg-black/5 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-2xl shadow-lg">
            {/* Header */}
            <div className="mb-8 sm:mb-10 text-center">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
                Pedí tu Presupuesto
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Contanos sobre tu dispositivo y te respondemos a la brevedad
              </p>
            </div>

            {/* Form */}
            <form
              className="space-y-4 sm:space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const msg = `Hola, soy ${fd.get("nombre")}. Tengo un problema con mi ${fd.get("dispositivo")}: ${fd.get("problema")}`;
                window.open(
                  `https://wa.me/5491124873190?text=${encodeURIComponent(msg)}`,
                  "_blank",
                );
              }}
            >
              <Input
                name="nombre"
                placeholder="Tu nombre"
                required
                className="w-full"
              />

              <Input
                name="dispositivo"
                placeholder="Dispositivo (ej: iPhone 14, PS5, Notebook HP)"
                required
                className="w-full"
              />

              <Textarea
                name="problema"
                placeholder="Describí brevemente el problema"
                rows={4}
                required
                className="w-full resize-none"
              />

              <Button
                type="submit"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
              >
                Enviar por WhatsApp
                <MessageCircle size={18} />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;





