"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "./Logo";
import {
  CONTACT,
  primaryNav,
  secondaryNav,
  stockCategories,
  storeCategories,
  waLink,
} from "./site-config";

// Radix leaves the body locked (no scroll, no clicks) when a menu/sheet
// closes because a Link inside it navigated, racing its own close cleanup.
function unstickBody() {
  document.body.style.removeProperty("pointer-events");
  document.body.style.removeProperty("overflow");
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileOpen(false);
    window.setTimeout(unstickBody, 0);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
          : "border-transparent bg-background",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}

          {secondaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}

          <NavDropdown
            label="Tienda"
            active={pathname.startsWith("/tienda")}
            items={storeCategories.map((c) => ({
              label: c.label,
              href: `/tienda?tipo=${c.value}`,
            }))}
          />
          <NavDropdown
            label="Stock"
            active={pathname.startsWith("/stock")}
            items={stockCategories.map((c) => ({
              label: c.label,
              href: `/stock?categoria=${c.value}`,
            }))}
          />
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
            <Button asChild size="sm" className="shadow-soft">
            <Link href="/presupuesto">Presupuesto online</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"
          >
            <a href={waLink("Hola ServiTec, quiero hacer una consulta")} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 lg:hidden">
          <Button
            asChild
            size="icon"
            variant="ghost"
            className="text-whatsapp"
            aria-label="WhatsApp"
          >
            <a href={waLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-5" />
            </a>
          </Button>
          <Sheet
            open={mobileOpen}
            onOpenChange={(open) => {
              setMobileOpen(open);
              if (!open) window.setTimeout(unstickBody, 0);
            }}
          >
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm p-0">
              <SheetHeader className="border-b px-5 py-4 text-left">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 overflow-y-auto px-4 py-4">
                {primaryNav.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive(link.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {secondaryNav.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive(link.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                <MobileGroup label="Tienda">
                  {storeCategories.map((c) => (
                    <Link
                      key={c.value}
                      href={`/tienda?tipo=${c.value}`}
                      onClick={closeMobileMenu}
                      className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                    >
                      {c.label}
                    </Link>
                  ))}
                </MobileGroup>

                <MobileGroup label="Stock">
                  {stockCategories.map((c) => (
                    <Link
                      key={c.value}
                      href={`/stock?categoria=${c.value}`}
                      onClick={closeMobileMenu}
                      className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                    >
                      {c.label}
                    </Link>
                  ))}
                </MobileGroup>

                <Link
                  href="/condiciones"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Condiciones generales
                </Link>
                <Link
                  href="/contacto"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Contacto
                </Link>

                <Button asChild className="mt-3">
                  <Link href="/presupuesto" onClick={closeMobileMenu}>Presupuesto online</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="mt-2 border-whatsapp text-whatsapp hover:bg-whatsapp/10 hover:text-whatsapp"
                >
                  <a href={waLink()} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    Escribinos por WhatsApp
                  </a>
                </Button>
                <p className="px-3 pt-4 text-xs text-muted-foreground">
                  {CONTACT.address}
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function NavDropdown({
  label,
  items,
  active,
}: {
  label: string;
  active: boolean;
  items: { label: string; href: string }[];
}) {
  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(open) => {
        if (!open) window.setTimeout(unstickBody, 0);
      }}
    >
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {label}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
      >
        {label}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="flex flex-col gap-0.5 pb-1 pl-3">{children}</div>}
    </div>
  );
}
