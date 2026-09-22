"use client";

import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedButton } from "@/components/site/AnimatedButton";
import { Button } from "@/components/ui/button";
import {
  catalogProductImage,
  loadComponentCatalog,
  matchesProductKeywords,
  matchesMonitorProduct,
  normalizeCatalogText,
  type CatalogProduct,
} from "@/lib/pc-catalog";
import { calculateInstallmentPrice, calculateNationalPrice, parsePrice } from "@/lib/utils";
import { getAssetUrl } from "@/lib/asset-url";
import type { Equipo } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Fan,
  HardDrive,
  Headphones,
  Keyboard,
  MemoryStick,
  Monitor,
  MonitorCog,
  Mouse,
  PackageCheck,
  RotateCcw,
  Send,
  X,
  Waves,
  Zap,
} from "lucide-react";
import { isPcArmadaCategoryValue } from "@/lib/utils";
import { PedidoCheckoutModal } from "@/components/shared/PedidoCheckoutModal";
import { buildPedidoMessage, formatPedidoNumero, getNextPedidoNumber, readStoredPedidos } from "@/lib/order-data";

type ComponentKey =
  | "motherboard"
  | "processor"
  | "memory"
  | "storage"
  | "graphics"
  | "power"
  | "case"
  | "cooling";
type ExtraKey =
  "monitor" | "headphones" | "mouse" | "mousepad" | "keyboard";
type Option = {
  name: string;
  detail: string;
  precio?: number;
  image?: string;
  platform?: string;
  memoryType?: string;
  brand?: string;
  specs?: Record<string, unknown>;
};
type Group = {
  key: ComponentKey;
  label: string;
  icon: typeof Cpu;
  options: Option[];
};
type Extra = { key: ExtraKey; label: string; icon: typeof Cpu; option: Option };
type PresetComponent = { key: ComponentKey; label: string; match?: RegExp; unavailable?: string };
type PresetType = "BASIC" | "MEDIUM" | "HARD" | "GAMER";
type PresetPc = { id: string; name: string; type: PresetType; detail: string; image: string; components: PresetComponent[]; price?: number };
type SavedPreset = { name?: string; detail?: string; image?: string; promo?: number; type?: PresetType; recomendada?: boolean; componentes?: Array<{ key: string; label: string; nombre: string; detalle: string; imagen: string; precio?: number; cantidad?: number }> };

const readyPcs: PresetPc[] = [
{
    id: "basic",
    name: "ServiTec BASIC",
type: "BASIC",
detail: "Para tareas básicas y uso diario",
image: "/ARMADOS/PC-BASIC.png",
components: [
  { key: "processor", label: "Procesador", match: /athlon\s+3000g.*radeon\s+vega\s+3.*am4/i },
  { key: "motherboard", label: "Motherboard", match: /asrock\s+b450m-hdv.*4\.0.*am4.*hdmi.*m\.2/i },
  { key: "memory", label: "Memoria RAM", match: /mancer.*ddr4.*8gb.*3200.*vant\s+s\s+black.*cl19/i },
  { key: "storage", label: "Almacenamiento", match: /(?=.*ssd)(?=.*adata)(?=.*256\s?gb)(?=.*su650)/i },
      { key: "graphics", label: "Placa de video", unavailable: "No tiene placa de video dedicada" },
  { key: "power", label: "Fuente", unavailable: "Integrada en el gabinete (500W)" },
  { key: "case", label: "Gabinete", match: /magnum\s+tech.*mt[-\s]?k835.*fuente\s+500w/i },
    ],
},
  {
    id: "oficina",
    name: "ServiTec MEDIUM",
    type: "MEDIUM",
    detail: "Para estudio, trabajo y uso diario",
    image: "/ARMADOS/PC-MEDIUM.png",
    components: [
      { key: "processor", label: "Procesador", match: /ryzen\s?3\s?3200g/i },
      { key: "motherboard", label: "Motherboard", match: /asrock\s+b550m-hdv.*ddr4.*am4/i },
      { key: "memory", label: "Memoria RAM", match: /mancer.*ddr4.*8gb.*3200/i },
      { key: "storage", label: "Almacenamiento", match: /ssd.*adata.*512gb.*su650|adata.*su650.*512gb/i },
      { key: "graphics", label: "Placa de video", unavailable: "No tiene placa de video dedicada" },
      { key: "power", label: "Fuente", match: /antec.*750w/i },
      { key: "case", label: "Gabinete", match: /mloxig.*sword|sword.*rgb/i },
    ],
  },
  {
    id: "gaming",
    name: "ServiTec HARD",
    type: "HARD",
    detail: "Rendimiento para jugar en Full HD",
    image: "/ARMADOS/PC-HARD.png",
    components: [
      { key: "processor", label: "Procesador", match: /ryzen\s?5\s?5600xt/i },
      { key: "motherboard", label: "Motherboard", match: /asus\s+tuf\s+gaming\s+b550m-plus\s+wifi\s+ii.*am4/i },
      { key: "cooling", label: "Refrigeración", match: /id[-\s]?cooling.*frozn\s+a620\s+pro\s+se/i },
      { key: "memory", label: "Memoria RAM", match: /patriot\s+viper.*ddr4\s+32gb.*2x16.*3200/i },
      { key: "graphics", label: "Placa de video", match: /gigabyte.*rtx\s?5060.*8gb.*gddr7.*gaming\s?oc/i },
      { key: "storage", label: "Almacenamiento", match: /kingston.*1tb.*nv3.*nvme.*gen4/i },
      { key: "power", label: "Fuente", match: /seasonic.*750w.*core\s+gx.*srp[-\s]?cgx751/i },
      { key: "case", label: "Gabinete", match: /lian\s+li.*vector\s+v100x/i },
    ],
  },
  {
    id: "creador",
    name: "ServiTec GAMER",
    type: "GAMER",
    detail: "Para diseño, edición y multitarea exigente",
    image: "/ARMADOS/PC-GAMER.png",
    components: [
      { key: "processor", label: "Procesador", match: /ryzen\s?7\s?9700x.*am5/i },
      { key: "motherboard", label: "Motherboard", match: /asus\s+prime\s+b850-plus\s+am5\s+ddr5/i },
      { key: "cooling", label: "Refrigeración", match: /deepcool.*lm360.*argb.*lcd/i },
      { key: "memory", label: "Memoria RAM (2 módulos)", match: /corsair\s+ddr5\s+8gb\s+5200mhz\s+vengeance\s+grey\s+cl40/i },
      { key: "graphics", label: "Placa de video", match: /xfx.*rx\s?9060\s?xt.*16gb.*gddr6/i },
      { key: "storage", label: "Almacenamiento", match: /adata.*1tb.*legend\s?900/i },
      { key: "storage", label: "Almacenamiento adicional", match: /kingston.*1tb.*nv3.*nvme.*gen4/i },
      { key: "power", label: "Fuente", match: /seasonic.*850w.*core\s+gx.*srp[-\s]?cgx851/i },
      { key: "case", label: "Gabinete", match: /lian\s+li.*o11.*vision\s+compact.*black/i },
    ],
  },
];

const presetBenefits = [
  "Cuotas sin interés",
  "Descuento en efectivo",
  "Garantía oficial",
  "Windows 10/11",
  "Paquete Office activado",
];

const resolveImageUrl = (path: string) => getAssetUrl(path);

const formatPrice = (price?: number) =>
  price === undefined || !Number.isFinite(Number(price))
    ? "Precio a confirmar"
    : `$${Number(price).toLocaleString("es-AR")}`;

const normalizePlatform = (value?: string) => {
  if (!value) return undefined;
  const amdSocket = value.match(/AM[45]/i)?.[0];
  if (amdSocket) return amdSocket.toUpperCase();

  const explicitIntelSocket = value.match(/(?:LGA|SOCKET)\s*(\d{4})/i)?.[1];
  const knownIntelSocket = value.match(/\b(1150|1151|1155|1200|1700|1851|2066|3647)\b/)?.[1];
  const intelSocket = explicitIntelSocket || knownIntelSocket;
  if (intelSocket) return `S${intelSocket}`;

  const normalized = value.replace(/\s/g, "").toUpperCase();
  return normalized.startsWith("S") ? normalized : undefined;
};

const normalizeSpecKey = (value: string) => normalizeCatalogText(value).replace(/[^a-z0-9]/g, "");
const getSpec = (option: Option, keys: string[]) => {
  const specs = option.specs || {};
  const entries = Object.entries(specs);
  const requested = keys.map(normalizeSpecKey);
  const entry = entries.find(([key, value]) => requested.includes(normalizeSpecKey(key)) && value !== undefined && value !== null && String(value).trim());
  return entry ? String(entry[1]).trim() : undefined;
};
const getOptionText = (option: Option) => `${option.name} ${option.detail} ${Object.values(option.specs || {}).join(" ")}`;
const getPlatform = (option: Option) => normalizePlatform(
  option.platform
    || getSpec(option, ["socket", "plataforma", "socket compatible"])
    || getOptionText(option).match(/AM[45]|S\d{4}|LGA\s?\d+|Socket\s?\d+/i)?.[0],
);
const getMemoryType = (option: Option) => (
  option.memoryType
  || getSpec(option, ["memoryType", "ramType", "tipo de memoria", "tipo de memoria ram"])
  || getOptionText(option).match(/DDR[45]/i)?.[0]
)?.toUpperCase();
const getPlatformFamily = (platform?: string) => {
  if (!platform) return undefined;
  if (/^AM[45]$/i.test(platform)) return "AMD";
  if (/^(?:S\d{4}|LGA\d+)$/i.test(platform)) return "INTEL";
  return undefined;
};
const getMemoryNamedFamily = (option: Option) => {
  if (/\bamd\b/i.test(option.name)) return "AMD";
  if (/\bintel\b/i.test(option.name)) return "INTEL";
  return undefined;
};
const getRamSlots = (option?: Option) => {
  if (!option) return undefined;
  const value = getSpec(option, ["ramSlots", "cantidad de slots ram", "slots ram", "cantidad slots de ram"]);
  const match = value?.match(/\d+/);
  return match ? Math.max(1, Number(match[0])) : undefined;
};
const getNumbers = (option: Option, keys: string[]) => {
  const value = getSpec(option, keys) || getOptionText(option);
  const match = value.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : undefined;
};
const getSpecNumber = (option: Option | undefined, keys: string[]) => {
  if (!option) return undefined;
  const value = getSpec(option, keys);
  const match = value?.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : undefined;
};
const getConsumptionWatts = (option: Option | undefined) => getSpecNumber(option, [
  "consumo",
  "powerConsumption",
  "consumo energetico",
  "tdp",
]);
const getCompatibleSockets = (option: Option) => getSpec(option, ["compatibleSocket", "socket compatible", "sockets compatibles", "socket"]);
const getSocketList = (value?: string) => {
  if (!value) return [];
  const matches = value.match(/AM[45]|S\d{4}|(?:LGA|SOCKET)\s*\d{4}|\b(?:1150|1151|1155|1200|1700|1851|2066|3647)\b/gi) || [];
  return matches.map((socket) => normalizePlatform(socket)).filter((socket): socket is string => Boolean(socket));
};
const getFormFactor = (option: Option) => getSpec(option, ["formFactor", "formato"]);
const hasIntegratedGraphics = (option?: Option) => {
  if (!option) return false;
  const description = getOptionText(option);
  if (/video integrado|gr[aá]ficos integrados|integrated graphics/i.test(description)) return true;
  if (/apu|radeon graphics/i.test(description)) return true;
  if (/intel\s+(?:core|ultra)/i.test(option.name)) return !/\d{4,5}[a-z]*f\b/i.test(option.name);
  if (/ryzen/i.test(option.name)) {
    const ryzenModel = option.name.match(/ryzen\s?[3579]\s?(\d{4})([a-z]*)\b/i);
    if (!ryzenModel) return false;
    const model = Number(ryzenModel[1]);
    const suffix = ryzenModel[2].toLowerCase();
    return suffix.includes("g") || (model >= 7000 && !suffix.includes("f"));
  }
  return /\d{4,5}g\b/i.test(option.name);
};
const mapProduct = (product: CatalogProduct): Option => ({
  name: product.nombre,
  detail: "",
  precio: product.precio,
  image: catalogProductImage(product) || undefined,
  brand: product.marca,
  specs: product.specs && typeof product.specs === "object" ? product.specs as Record<string, unknown> : undefined,
  platform: normalizePlatform(String(product.socket || "").match(/AM[45]|S\d{4}|LGA\s?\d+/i)?.[0]),
  memoryType: String(product.memoryType || product.ramType || "").match(/DDR[45]/i)?.[0].toUpperCase(),
});

const classifyPeripheral = (productName: string): ExtraKey | null => {
  const normalized = normalizeCatalogText(productName);
  // Keep monitor detection aligned with the existing catalog rules.
  if (matchesMonitorProduct(productName)) return "monitor";
  // Check mouse pads before mouse because "mousepad" contains "mouse".
  if (/(mousepad|mouse pad|alfombrilla|pad gamer)/.test(normalized)) return "mousepad";
  if (matchesProductKeywords(productName, ["auricular", "auriculares", "headset", "earbuds", "earphone"])) return "headphones";
  if (matchesProductKeywords(productName, ["teclado", "keyboard"])) return "keyboard";
  if (matchesProductKeywords(productName, ["mouse", "raton"])) return "mouse";
  return null;
};

const groups: Group[] = [
  {
    key: "motherboard",
    label: "Motherboard",
    icon: MonitorCog,
    options: [
      {
        name: "MSI A520M-A PRO",
        detail: "AM4 - DDR4 - M.2 - Micro ATX",
      },
      {
        name: "Gigabyte B550M DS3H",
        detail: "AM4 - DDR4 - PCIe 4.0 - Micro ATX",
      },
    ],
  },
  {
    key: "processor",
    label: "Procesador",
    icon: Cpu,
    options: [
      {
        name: "AMD Ryzen 5 5600G",
        detail: "6 nucleos - Video integrado - AM4",
      },
      {
        name: "AMD Ryzen 5 5600",
        detail: "6 nucleos - 12 hilos - AM4",
      },
    ],
  },
  {
    key: "memory",
    label: "Memoria RAM",
    icon: MemoryStick,
    options: [
      {
        name: "Kingston Fury 16 GB",
        detail: "2 x 8 GB - DDR4 - 3200 MHz",
      },
      {
        name: "Kingston Fury 32 GB",
        detail: "2 x 16 GB - DDR4 - 3200 MHz",
      },
    ],
  },
  {
    key: "storage",
    label: "Almacenamiento",
    icon: HardDrive,
    options: [
      {
        name: "SSD 480 GB",
        detail: "SATA III - Lectura hasta 500 MB/s",
      },
      {
        name: "SSD NVMe 1 TB",
        detail: "M.2 - PCIe - Lectura hasta 3500 MB/s",
      },
    ],
  },
  {
    key: "graphics",
    label: "Placa de video",
    icon: Zap,
    options: [
      {
        name: "Graficos integrados",
        detail: "Ideal para oficina, estudio y multimedia",
      },
      {
        name: "GeForce RTX 4060 8 GB",
        detail: "Gaming Full HD - Ray tracing - DLSS 3",
      },
    ],
  },
  {
    key: "power",
    label: "Fuente",
    icon: Zap,
    options: [
      {
        name: "Fuente 600 W 80+ Bronze",
        detail: "600 W - Protecciones OVP - OCP",
      },
      {
        name: "Fuente 750 W 80+ Bronze",
        detail: "750 W - Margen extra para placa de video",
      },
    ],
  },
  {
    key: "case",
    label: "Gabinete",
    icon: MonitorCog,
    options: [
      {
        name: "Gabinete mATX Airflow",
        detail: "Frente mallado - 3 ventiladores",
      },
      {
        name: "Gabinete Mid Tower RGB",
        detail: "Vidrio templado - 4 ventiladores",
      },
    ],
  },
  {
    key: "cooling",
    label: "Refrigeracion",
    icon: Fan,
    options: [
      {
        name: "Cooler de fabrica",
        detail: "Incluido con procesadores seleccionados",
      },
      {
        name: "Cooler torre 120 mm",
        detail: "Mas silencio y temperatura estable",
      },
    ],
  },
];

const extras: Extra[] = [
  {
    key: "monitor",
    label: "Monitor",
    icon: Monitor,
    option: {
      name: "Monitor LED 24 pulgadas",
      detail: "Full HD - HDMI - 75 Hz",
    },
  },
  {
    key: "headphones",
    label: "Auriculares",
    icon: Headphones,
    option: {
      name: "Auriculares gamer",
      detail: "Microfono - Sonido envolvente",
    },
  },
  {
    key: "mouse",
    label: "Mouse",
    icon: Mouse,
    option: {
      name: "Mouse gamer",
      detail: "Sensor optico - 6 botones",
    },
  },
  {
    key: "mousepad",
    label: "Mouse pad",
    icon: Mouse,
    option: {
      name: "Mouse pad gamer",
      detail: "Superficie antideslizante",
    },
  },
  {
    key: "keyboard",
    label: "Teclado",
    icon: Keyboard,
    option: {
      name: "Teclado mecanico",
      detail: "Retroiluminado - Layout espanol",
    },
  },
];
const ArmarPc = () => {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<
    Partial<Record<ComponentKey, number>>
  >({});
  const [selectedMemorySlots, setSelectedMemorySlots] = useState<number[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<ExtraKey[]>([]);
  const [selectedExtraModels, setSelectedExtraModels] = useState<Partial<Record<ExtraKey, number>>>({});
  const [openGroup, setOpenGroup] = useState<ComponentKey | null>(null);
  const [infoPc, setInfoPc] = useState<PresetPc | null>(null);
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [openExtra, setOpenExtra] = useState<ExtraKey | null>(null);
  const [catalogGroups, setCatalogGroups] = useState(() => groups.map((group) => ({ ...group, options: [] })));
  const [catalogExtras, setCatalogExtras] = useState<Extra[]>([]);
  const [catalogExtraOptions, setCatalogExtraOptions] = useState<Partial<Record<ExtraKey, Option[]>>>({});
  const [editablePresets, setEditablePresets] = useState<Record<string, SavedPreset>>({});
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetsError, setPresetsError] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [componentSearch, setComponentSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const componentDialogRef = useDialogFocus(Boolean(openGroup), () => setOpenGroup(null));
  const extraDialogRef = useDialogFocus(Boolean(openExtra), () => setOpenExtra(null));
  const infoDialogRef = useDialogFocus(Boolean(infoPc), () => setInfoPc(null));
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | null>(null);

  const availablePcs = useMemo(
    () => Object.entries(editablePresets)
      .filter(([, preset]) => preset.recomendada)
      .map(([id, preset]) => ({
        id,
        name: preset.name || "PC armada",
        type: preset.type || "BASIC",
        detail: preset.detail || "Configuración armada por ServiTec",
        image: preset.image || "",
        components: preset.componentes?.map((component) => ({ key: component.key as ComponentKey, label: component.label })) || [],
        price: preset.promo,
      })),
    [editablePresets],
  );

  useEffect(() => {
    let alive = true;
    fetch("/api/equipos")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Equipo[]) => {
        if (!alive) return;
        const presets = Object.fromEntries(
          (Array.isArray(data) ? data : []).sort((a, b) => a.orden - b.orden)
            .filter(
              (e) =>
                isPcArmadaCategoryValue(String(e.categoria ?? "")) &&
                e.estado !== "vendido",
            )
            .map((e) => [
              e.id,
              {
                name: e.nombre,
                detail: e.detail,
                image: e.imagenes?.[0] || "",
                promo: Number(e.promo || e.original || 0),
                recomendada: Boolean(e.recomendada),
                componentes: e.componentes,
              },
            ]),
        );
        setEditablePresets(presets);
      })
      .catch(() => { if (alive) setPresetsError(true); })
      .finally(() => { if (alive) setPresetsLoading(false); });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const loadCatalog = async () => {
      const productMap = await loadComponentCatalog() as unknown as Record<string, CatalogProduct[]>;
      const loadedGroups = groups.map((group) => ({
        ...group,
        options: productMap[group.key]?.filter(product => product.stock !== 0).map((product) => mapProduct(product)) ?? [],
      }));
      setCatalogGroups(loadedGroups);
      const peripheralProducts = productMap.peripherals ?? [];
      const monitorProducts = peripheralProducts.filter((product) => classifyPeripheral(product.nombre) === "monitor");
      const loadedExtras = extras.flatMap((extra) => {
        const source = extra.key === "monitor"
          ? monitorProducts[0]
          : peripheralProducts.find((product) => classifyPeripheral(product.nombre) === extra.key);
        return source ? [{ ...extra, option: mapProduct(source) }] : [];
      });
      setCatalogExtras(loadedExtras);
      const peripheralOptions = extras.map(({ key }) => [
        key,
        peripheralProducts.filter((product) => classifyPeripheral(product.nombre) === key)
          .map((product) => mapProduct(product)),
      ]);
      setCatalogExtraOptions(Object.fromEntries(peripheralOptions) as Partial<Record<ExtraKey, Option[]>>);
    };
    void loadCatalog().catch(() => setCatalogError(true)).finally(() => setCatalogLoading(false));
  }, []);
  const pricedCatalogGroups = useMemo(
    () => catalogGroups.map((group) => ({
      ...group,
      options: group.options.map((option) => ({
        ...option,
        precio: option.precio === undefined ? undefined : parsePrice(option.precio),
      })),
    })),
    [catalogGroups],
  );
  const selectedGroups = pricedCatalogGroups.filter(
    (group) => group.key === "memory" ? selectedMemorySlots.length > 0 : selected[group.key] !== undefined,
  );
  const orderedGroups = [...pricedCatalogGroups].sort((left, right) => {
    if (left.key === "processor") return -1;
    if (right.key === "processor") return 1;
    return 0;
  });
  const activePreset = availablePcs[activePresetIndex] || availablePcs[0];
  const activePresetImage = activePreset ? resolveImageUrl(activePreset.image) : "";
  const currentGroup = orderedGroups.find((group) => group.key === openGroup);
  const getPresetOptions = (preset: PresetPc) => preset.components.map((component) => {
    const group = catalogGroups.find((item) => item.key === component.key);
    const savedComponent = editablePresets[preset.id]?.componentes?.find((item) => item.key === component.key);
    if (savedComponent) {
      const currentCatalogProduct = group?.options.find((item) => item.name === savedComponent.nombre);
      const currentPrice = currentCatalogProduct?.precio ?? savedComponent.precio;
      return {
        ...component,
        label: savedComponent.key === "memory" ? `x${savedComponent.cantidad || 1} ${savedComponent.label}` : savedComponent.label,
        option: { name: savedComponent.nombre, detail: savedComponent.detalle, image: savedComponent.imagen, precio: currentPrice },
      };
    }
    const option = component.match ? group?.options.find((item) => component.match?.test(item.name)) : undefined;
    return { ...component, option };
  });
  const quotePreset = (preset: PresetPc) => {
    const parts = getPresetOptions(preset).map((component) =>
      `${component.label}: ${component.option?.name || component.unavailable || "A definir"}`,
    );
    const message = [
      `Hola ServiTec, quiero cotizar la ${preset.name}:`,
      ...parts,
      `Perfil: ${preset.detail}`,
      `Incluye: ${presetBenefits.join(", ")}`,
    ].join("\n");
    window.open(
      `https://wa.me/5491124873190?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const currentExtra = catalogExtras.find((extra) => extra.key === openExtra);
  const currentExtraOptions = openExtra ? catalogExtraOptions[openExtra] ?? [currentExtra?.option].filter(Boolean) as Option[] : [];
  const selectedProcessor = selected.processor !== undefined ? catalogGroups.find((group) => group.key === "processor")?.options[selected.processor] : undefined;
  const selectedMotherboard = selected.motherboard !== undefined ? catalogGroups.find((group) => group.key === "motherboard")?.options[selected.motherboard] : undefined;
  const selectedGraphics = selected.graphics !== undefined ? catalogGroups.find((group) => group.key === "graphics")?.options[selected.graphics] : undefined;
  const selectedPower = selected.power !== undefined ? catalogGroups.find((group) => group.key === "power")?.options[selected.power] : undefined;
  const selectedCooling = selected.cooling !== undefined ? catalogGroups.find((group) => group.key === "cooling")?.options[selected.cooling] : undefined;
  const selectedCase = selected.case !== undefined ? catalogGroups.find((group) => group.key === "case")?.options[selected.case] : undefined;
  const maxMemorySlots = getRamSlots(selectedMotherboard) || 1;
  const requiresDedicatedGraphics = selectedProcessor !== undefined && !hasIntegratedGraphics(selectedProcessor);
  const requiredGroups = orderedGroups.filter((group) => group.key !== "graphics" || requiresDedicatedGraphics);
  const isComponentSelectionComplete = requiredGroups.every((group) => {
    return group.key === "memory" ? selectedMemorySlots.length > 0 : selected[group.key] !== undefined;
  });
  const selectedConsumptionOptions = orderedGroups.flatMap((group) => {
    if (group.key === "power") return [];
    if (group.key === "memory") return selectedMemorySlots.map((index) => group.options[index]).filter(Boolean);
    if (selected[group.key] === undefined) return [];
    const option = group.options[selected[group.key]];
    return option ? [option] : [];
  });
  const estimatedConsumption = selectedConsumptionOptions.reduce(
    (total, option) => total + (getConsumptionWatts(option) || 0),
    0,
  );
  const sourceCapacity = getSpecNumber(selectedPower, ["wattage", "potencia", "potencia total"]);
  const consumptionPercentage = sourceCapacity
    ? Math.min((estimatedConsumption / sourceCapacity) * 100, 100)
    : 0;
  const hasConsumptionData = selectedConsumptionOptions.some((option) => getConsumptionWatts(option) !== undefined);
  const powerStatus = !selectedPower
    ? "Seleccioná una fuente para definir el máximo"
    : estimatedConsumption > sourceCapacity!
      ? "El consumo estimado supera la potencia de la fuente"
      : hasConsumptionData
        ? "Consumo estimado dentro de la capacidad de la fuente"
        : "Los componentes seleccionados no informan consumo";
  const graphicsSummary = selected.graphics !== undefined
    ? catalogGroups.find((group) => group.key === "graphics")?.options[selected.graphics]?.name
    : "Sin placa dedicada (usa los gráficos del procesador)";
  const isCompatible = (group: Group, option: Option) => {
    if (group.key === "memory") {
      const motherboardMemory = selectedMotherboard && getMemoryType(selectedMotherboard);
      const processorFamily = getPlatformFamily(getPlatform(selectedProcessor));
      const memoryFamily = getMemoryNamedFamily(option);
      return selectedMemorySlots.length < maxMemorySlots
        && (!motherboardMemory || !getMemoryType(option) || getMemoryType(option) === motherboardMemory)
        && (!processorFamily || !memoryFamily || processorFamily === memoryFamily);
    }

    if (group.key !== "motherboard" && group.key !== "processor") {
      if (group.key === "graphics" && option.name === "Graficos integrados") return hasIntegratedGraphics(selectedProcessor);
      if (group.key === "cooling" && selectedProcessor) {
        const compatibleSockets = getCompatibleSockets(option);
        const processorPlatform = getPlatform(selectedProcessor);
        const coolingPlatforms = getSocketList(compatibleSockets);
        return !compatibleSockets || !processorPlatform || !coolingPlatforms.length || coolingPlatforms.includes(processorPlatform);
      }
      if (group.key === "storage" && selectedMotherboard) {
        const interfaceName = getSpec(option, ["interface", "interfaz"]) || getOptionText(option);
        const hasM2 = /m\.2|nvme/i.test(interfaceName);
        const hasSata = /sata/i.test(interfaceName);
        const m2Slots = getNumbers(selectedMotherboard, ["m2Slots", "slots m2", "slots m\.2"]);
        const sataPorts = getNumbers(selectedMotherboard, ["sataPorts", "puertos sata"]);
        if (hasM2 && m2Slots === 0) return false;
        if (hasSata && sataPorts === 0) return false;
      }
      if (group.key === "power" && selectedGraphics) {
        const requiredWatts = getNumbers(selectedGraphics, ["recommendedPsu", "fuente recomendada"]);
        const powerWatts = getNumbers(option, ["wattage", "potencia"]);
        if (requiredWatts !== undefined && powerWatts !== undefined && powerWatts < requiredWatts) return false;
      }
      if (group.key === "graphics" && selectedPower) {
        const requiredWatts = getNumbers(option, ["recommendedPsu", "fuente recomendada"]);
        const powerWatts = getNumbers(selectedPower, ["wattage", "potencia"]);
        if (requiredWatts !== undefined && powerWatts !== undefined && powerWatts < requiredWatts) return false;
      }
      if (group.key === "case" && selectedMotherboard) {
        const caseFormats = getSpec(option, ["compatibleMotherboards", "motherboards compatibles", "formato"]);
        const motherboardFormat = getFormFactor(selectedMotherboard);
        if (caseFormats && motherboardFormat && !normalizeCatalogText(caseFormats).includes(normalizeCatalogText(motherboardFormat))) return false;
      }
      if (group.key === "graphics" && selectedCase) {
        const maxLength = getNumbers(selectedCase, ["maxGpuLength", "longitud maxima de gpu"]);
        const gpuLength = getNumbers(option, ["length", "longitud"]);
        if (maxLength !== undefined && gpuLength !== undefined && gpuLength > maxLength) return false;
      }
      if (group.key === "cooling" && selectedCase) {
        const maxHeight = getNumbers(selectedCase, ["maxCoolerHeight", "altura maxima de cooler"]);
        const coolerHeight = getNumbers(option, ["height", "altura"]);
        if (maxHeight !== undefined && coolerHeight !== undefined && coolerHeight > maxHeight) return false;
      }
      return true;
    }

    const relatedKey = group.key === "motherboard" ? "processor" : "motherboard";
    const relatedGroup = catalogGroups.find((item) => item.key === relatedKey);
    const relatedOption = relatedGroup && selected[relatedKey] !== undefined
      ? relatedGroup.options[selected[relatedKey] ?? 0]
      : undefined;

    if (!relatedOption) return true;
    const optionPlatform = getPlatform(option);
    const relatedPlatform = getPlatform(relatedOption);
    if (optionPlatform && relatedPlatform && optionPlatform !== relatedPlatform) return false;
    return true;
  };
  const orderedOptions = currentGroup
    ? [...currentGroup.options].sort((left, right) => Number(isCompatible(currentGroup, right)) - Number(isCompatible(currentGroup, left)))
    : [];
  const nationalTotal = useMemo(
    () => selectedGroups.reduce((sum, group) => sum + parsePrice(group.options[selected[group.key] ?? 0].precio || 0), 0)
      + selectedExtras.reduce((sum, key) => sum + parsePrice(catalogExtraOptions[key]?.[selectedExtraModels[key] ?? 0]?.precio || catalogExtras.find((item) => item.key === key)?.option.precio || 0), 0),
    [catalogExtraOptions, catalogExtras, selectedGroups, selected, selectedExtras, selectedExtraModels],
  );
  
  const reset = () => {
    setSelected({});
    setSelectedMemorySlots([]);
    setSelectedExtras([]);
    setSelectedExtraModels({});
    setPaymentMethod(null);
    setStep(1);
    setOpenGroup(null);
    setOpenExtra(null);
  };
  const pedidoNumero = useMemo(() => getNextPedidoNumber(readStoredPedidos()), [selected]);

  const armarPedidoItems = (() => {
    const items = paymentMethod
      ? [{
        nombre: `Forma de pago: ${paymentMethod === "tarjeta" ? "Tarjeta de crédito (3/6 cuotas)" : "Efectivo / Transferencia"}`,
        cantidad: 1,
        precio: 0,
      }]
      : [];
    orderedGroups
      .filter((group) => group.key === "memory" ? selectedMemorySlots.length > 0 : selected[group.key] !== undefined)
      .forEach((group) => {
        if (group.key === "memory") {
          selectedMemorySlots.forEach((memoryIndex) => {
            const memory = group.options[memoryIndex];
            if (memory) items.push({ nombre: memory.name, cantidad: 1, precio: parsePrice(memory.precio || 0) });
          });
          return;
        }
        items.push({
          nombre: group.options[selected[group.key] ?? 0].name,
          cantidad: 1,
          precio: parsePrice(group.options[selected[group.key] ?? 0].precio || 0),
        });
      });

    selectedExtras.forEach((key) => {
      const option = catalogExtraOptions[key]?.[selectedExtraModels[key] ?? 0] ?? catalogExtras.find((extra) => extra.key === key)?.option;
      if (option?.name) {
        items.push({
          nombre: option.name,
          cantidad: 1,
          precio: parsePrice(option.precio || 0),
        });
      }
    });

    return items;
  })();

  const itemsSubtotal = armarPedidoItems.reduce((s, it) => s + (Number(it.precio || 0) * (it.cantidad || 1)), 0);

  // Use gross sum of green "Precio" values as efectivo/transferencia total
  const itemsGrossTotal = itemsSubtotal;

  // Calculate installment on the gross total when selection is complete
  const installmentTotal = (() => {
    if (!isComponentSelectionComplete) return 0;
    return calculateInstallmentPrice(itemsGrossTotal);
  })();

  const selectedTotal = paymentMethod === "tarjeta" && isComponentSelectionComplete ? installmentTotal : itemsGrossTotal;

  const sendQuote = () => {
    setCheckoutOpen(true);
  };
  return (
    <motion.main
      className="pc-builder relative min-h-screen overflow-x-hidden bg-white pb-24 text-slate-900"
      initial={mounted && !reduceMotion ? { opacity: 0, y: 10 } : false}
      animate={mounted && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute left-[39%] top-1/2 hidden h-[900px] w-[900px] -translate-y-1/2 rounded-full border border-dashed border-red-200/60 xl:block" />
      <div className="pointer-events-none absolute left-[35%] top-1/2 hidden h-[650px] w-[650px] -translate-y-1/2 rounded-full border border-red-100 xl:block" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-3 py-4 sm:px-8 sm:py-5 lg:px-10">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={18} /> Volver
          </button>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src="/logo.png"
              alt="ServiTec"
              className="h-10 w-10 object-contain"
            />
            <span className="hidden font-display text-lg font-bold sm:block">
              Servi<span className="text-primary">Tec</span>
            </span>
            <span className="hidden truncate border-l border-white/5 pl-3 text-xs uppercase tracking-[0.2em] text-slate-400 sm:block">
              Armador de PC
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </header>
        <nav className="mx-auto mt-6 flex w-full max-w-full items-center justify-center overflow-x-auto pb-1">
          {[
            { number: 1, label: "Componentes" },
            { number: 2, label: "Accesorios" },
            { number: 3, label: "Resumen" },
          ].map((item, index) => (
            <div key={item.number} className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  item.number < step && setStep(item.number as 1 | 2 | 3)
                }
                className={`flex items-center gap-2 text-xs ${step === item.number ? "text-secondary" : item.number < step ? "text-white" : "text-slate-500"}`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border font-bold ${step === item.number ? "border-secondary bg-secondary text-slate-950" : item.number < step ? "border-secondary text-secondary" : "border-slate-600"}`}
                >
                  {item.number < step ? <Check size={14} /> : item.number}
                </span>
                <span className="hidden sm:block">{item.label}</span>
              </button>
              {index < 2 && (
                <span
                  className={`mx-2 h-px w-8 shrink-0 sm:mx-3 sm:w-20 ${item.number < step ? "bg-secondary" : "bg-slate-600"}`}
                />
              )}
            </div>
          ))}
        </nav>
        {step === 1 && (
          <div className="mx-auto flex w-full max-w-4xl flex-1 items-start justify-center pt-8 text-center">
            <div className="w-full pb-24 lg:pb-8">
              <p className="text-sm font-semibold text-secondary">
                Paso 1 de 3
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
                Elegi los componentes
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Abrí cada categoría y seleccioná una opción. La placa de video es opcional si tu procesador tiene gráficos integrados.
              </p>
              {activePreset ? <div className="mx-auto mt-7 max-w-4xl">
                <article className="group relative overflow-hidden rounded-2xl border border-red-100 bg-white shadow-2xl shadow-red-100 transition-all duration-500 hover:border-secondary/60 sm:rounded-3xl">
                  <div className="absolute inset-0 bg-red-50" />
                  <div className="relative grid md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
                    <div className="flex min-h-[18rem] items-center justify-center bg-red-50 p-5 sm:min-h-[23rem] sm:p-8">
                      <img
                        key={activePreset.id}
                        src={activePresetImage}
                        alt={`PC armada ${activePreset.name}`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/api/assets/placeholder.svg";
                        }}
                        className="h-full max-h-[20rem] w-full object-contain transition-all duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-col justify-center p-6 sm:p-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Configuración recomendada</p>
                      <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                        {activePreset.name}
                      </h2>
                      {activePreset.price !== undefined && (
                        <p className="mt-2 text-lg font-bold text-emerald-700">
                          Precio: {formatPrice(activePreset.price)}
                        </p>
                      )}
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-red-900/70 sm:text-base">{activePreset.detail}. Revisá cada componente y cotizá tu equipo directamente con ServiTec.</p>
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {presetBenefits.map((benefit) => (
                          <span key={benefit} className="flex items-center gap-2 text-xs font-medium text-red-900/80">
                            <Check size={14} className="shrink-0 text-secondary" /> {benefit}
                          </span>
                        ))}
                      </div>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button type="button" onClick={() => setInfoPc(activePreset)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-900 transition hover:border-secondary hover:bg-red-50">Ver Componentes <ArrowRight size={16} /></button>
                        <button type="button" onClick={() => quotePreset(activePreset)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-secondary/90">Cotizar <Send size={16} /></button>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-between border-t border-white/10 px-5 py-3 sm:px-8">
                    <button type="button" aria-label="PC sugerida anterior" onClick={() => setActivePresetIndex((index) => (index - 1 + availablePcs.length) % availablePcs.length)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-secondary hover:bg-white/5 hover:text-white"><ChevronLeft size={18} /></button>
                    <div className="flex items-center gap-2" aria-label="Selector de PC sugerida">
                      {availablePcs.map((pc, index) => <button key={pc.id} type="button" aria-label={`Mostrar ${pc.name}`} aria-current={index === activePresetIndex} onClick={() => setActivePresetIndex(index)} className={`h-2 rounded-full transition-all ${index === activePresetIndex ? "w-8 bg-secondary" : "w-2 bg-slate-600 hover:bg-slate-400"}`} />)}
                    </div>
                    <button type="button" aria-label="PC sugerida siguiente" onClick={() => setActivePresetIndex((index) => (index + 1) % availablePcs.length)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-secondary hover:bg-white/5 hover:text-white"><ChevronRight size={18} /></button>
                  </div>
                </article>
              </div> : (
                <p className="mx-auto mt-7 max-w-2xl rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-900/70">
                  {presetsLoading ? "Cargando configuraciones recomendadas…" : presetsError ? "No pudimos cargar las recomendaciones. Reintentá actualizando la página." : "No hay configuraciones recomendadas disponibles."}
                </p>
              )}
              {(catalogLoading || catalogError) && <p role="status" className="mx-auto mt-5 max-w-3xl rounded-xl border p-4 text-sm">{catalogLoading ? "Cargando componentes y precios…" : "No pudimos cargar los componentes. Actualizá la página para reintentar."}</p>}
              <div className="mx-auto mt-7 grid max-w-3xl gap-2 text-left sm:grid-cols-2">
                {orderedGroups.map((group) => {
                  const Icon = group.icon;
                  const value = selected[group.key];
                  const memorySelected = group.key === "memory" && selectedMemorySlots.length > 0;
                  return (
                    <div key={group.key} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setComponentSearch(""); setOpenGroup(group.key); }} disabled={catalogLoading || catalogError}
                        className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-red-100 bg-white p-3 text-left transition-colors hover:border-secondary/70 hover:bg-red-50 ${value !== undefined || memorySelected ? "border-secondary/60 bg-red-50" : ""}`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${value !== undefined || memorySelected ? "bg-secondary text-slate-950" : "bg-red-50 text-red-800"}`}>
                          {value !== undefined || memorySelected ? <Check size={19} /> : <Icon size={19} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{group.label}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {value !== undefined ? group.options[value].name : group.key === "graphics" && !requiresDedicatedGraphics ? "Opcional con gráficos integrados" : "Seleccioná una opción"}
                          </span>
                        </span>
                        {memorySelected && <span className="text-[11px] font-semibold text-secondary">{selectedMemorySlots.length}/{maxMemorySlots} slots</span>}
                        <ArrowRight size={15} className="ml-auto shrink-0 text-slate-500" />
                      </button>
                      {(value !== undefined || memorySelected) && (
                        <button
                          type="button"
                          onClick={() => setSelected((current) => {
                            const next = { ...current };
                            delete next[group.key];
                            if (group.key === "memory") setSelectedMemorySlots([]);
                            return next;
                          })}
                          aria-label={`Quitar ${group.label}`}
                          className="grid size-9 shrink-0 place-items-center rounded-full border border-red-200 bg-white text-red-700 transition hover:border-red-400 hover:bg-red-50"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mx-auto mt-5 w-full max-w-3xl rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-left" aria-live="polite">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-sky-900">
                    <Waves size={15} className="shrink-0 text-sky-600" />
                    <span className="truncate">Consumo estimado</span>
                  </span>
                  <span className={`shrink-0 font-bold ${sourceCapacity !== undefined && estimatedConsumption > sourceCapacity ? "text-red-600" : "text-sky-800"}`}>
                    {estimatedConsumption} W{sourceCapacity !== undefined ? ` / ${sourceCapacity} W` : ""}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sky-100" role="progressbar" aria-valuemin={0} aria-valuemax={sourceCapacity || 0} aria-valuenow={Math.min(estimatedConsumption, sourceCapacity || 0)} aria-label="Consumo estimado de la PC">
                  <div
                    className={`power-water-flow h-full rounded-full transition-[width] duration-500 ${sourceCapacity !== undefined && estimatedConsumption > sourceCapacity ? "bg-red-500" : "bg-sky-500"}`}
                    style={{ width: `${consumptionPercentage}%` }}
                  />
                </div>
                <p className={`mt-1 text-[11px] ${sourceCapacity !== undefined && estimatedConsumption > sourceCapacity ? "font-bold text-red-600" : "text-sky-700"}`}>
                  {powerStatus}
                </p>
              </div>
              <div className="mt-7 flex items-center justify-center gap-5">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!isComponentSelectionComplete}
                  className="gap-2 bg-secondary text-slate-950 hover:bg-secondary/90"
                >
                  Continuar a accesorios <ArrowRight size={17} />
                </Button>
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="mx-auto w-full max-w-5xl flex-1 py-10">
            <div className="text-center">
              <p className="text-sm font-semibold text-secondary">
                Paso 2 de 3 - Opcional
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
                Completá tu setup
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Sumá monitor, audio y periféricos o continuá sin agregar nada.
              </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catalogExtras.map((extra) => {
                const Icon = extra.icon;
                const active = selectedExtras.includes(extra.key);
                return (
                  <button
                    key={extra.key}
                    type="button"
                    onClick={() => setOpenExtra(extra.key)}
                    className={`border border-red-100 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-secondary/70 hover:bg-red-50 hover:shadow-lg hover:shadow-red-100 ${active ? "border-secondary bg-red-50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full ${active ? "bg-secondary text-slate-950" : "bg-red-50 text-red-800"}`}
                      >
                        <Icon size={21} />
                      </span>
                      {active && <Check className="text-secondary" size={19} />}
                    </div>
                    <h2 className="mt-5 font-display text-lg font-bold">
                      {extra.label}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedExtras.includes(extra.key)
                        ? catalogExtraOptions[extra.key]?.[selectedExtraModels[extra.key] ?? 0]?.name
                        : extra.option.detail}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-10 flex flex-col-reverse justify-center gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2 border-slate-600 bg-transparent text-white hover:bg-white/10"
              >
                <ArrowLeft size={17} /> Volver a componentes
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="gap-2 bg-secondary text-slate-950 hover:bg-secondary/90"
              >
                Ver configuración final <ArrowRight size={17} />
              </Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="mx-auto w-full max-w-4xl flex-1 py-8">
            <div className="text-center">
              <p className="text-sm font-semibold text-secondary">
                Paso 3 de 3 - Todo listo
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
                Tu configuración final
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Revisá tu selección antes de pedir una cotización.
              </p>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="rounded-2xl border border-red-100 bg-white p-5 sm:rounded-3xl sm:p-7">
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedGroups.map((group) => (
                    <div
                      key={group.key}
                      className="flex items-start gap-3 border-b border-white/10 pb-3"
                    >
                      <group.icon
                        className="mt-0.5 shrink-0 text-secondary"
                        size={18}
                      />
                      <div>
                        <p className="text-xs text-slate-500">{group.label}</p>
                        <p className="text-sm font-semibold">
                          {group.key === "memory"
                            ? `${selectedMemorySlots.length} modulo(s): ${selectedMemorySlots.map((index) => group.options[index]?.name).filter(Boolean).join(", ")}`
                            : group.options[selected[group.key] ?? 0].name}
                        </p>
                        {group.key === "memory" ? (
                          <>
                            <p className="text-sm font-semibold text-emerald-700">
                              Precio: {formatPrice(selectedMemorySlots.reduce((sum, index) => sum + parsePrice(group.options[index]?.precio || 0), 0))}
                            </p>
                            <p className="text-xs text-slate-500">Cada modulo ocupa 1 slot.</p>
                          </>
                        ) : group.options[selected[group.key] ?? 0].precio !== undefined && (
                          <>
                            <p className="text-sm font-semibold text-emerald-700">
                              Precio: {formatPrice(parsePrice(group.options[selected[group.key] ?? 0].precio))}
                            </p>
                            {/* Installments per-item removed; show installments only on final total when selection complete */}
                            <p className="text-xs text-slate-500">
                              Sin impuestos nac.: ${calculateNationalPrice(parsePrice(group.options[selected[group.key] ?? 0].precio)).toLocaleString("es-AR")}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {selected.graphics === undefined && !requiresDedicatedGraphics && (
                    <div className="flex items-start gap-3 border-b border-white/10 pb-3">
                      <Zap className="mt-0.5 shrink-0 text-secondary" size={18} />
                      <div>
                        <p className="text-xs text-slate-500">Placa de video</p>
                        <p className="text-sm font-semibold">{graphicsSummary}</p>
                      </div>
                    </div>
                  )}
                  {selectedExtras.map((key) => {
                    const extra = catalogExtras.find((item) => item.key === key);
                    return extra ? (
                      <div
                        key={key}
                        className="flex items-start gap-3 border-b border-white/10 pb-3"
                      >
                        <extra.icon
                          className="mt-0.5 shrink-0 text-secondary"
                          size={18}
                        />
                        <div>
                          <p className="text-xs text-slate-500">
                            {extra.label}
                          </p>
                          <p className="text-sm font-semibold">
                            {catalogExtraOptions[extra.key]?.[selectedExtraModels[extra.key] ?? 0]?.name ?? extra.option.name}
                          </p>
                          {(() => {
                            const extraOption = catalogExtraOptions[extra.key]?.[selectedExtraModels[extra.key] ?? 0] ?? extra.option;
                            return extraOption.precio !== undefined ? (
                              <>
                                <p className="text-sm font-semibold text-emerald-700">
                                  Precio: {formatPrice(parsePrice(extraOption.precio))}
                                </p>
                                {/* Installments per-item removed; displayed on final price when ready */}
                                <p className="text-xs text-slate-500">
                                  Sin impuestos nac.: ${calculateNationalPrice(parsePrice(extraOption.precio)).toLocaleString("es-AR")}
                                </p>
                              </>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                  <PackageCheck size={18} className="text-secondary" /> Armado,
                  asesoramiento y garantia escrita incluidos.
                </div>
              </div>
              <aside className="rounded-2xl border border-secondary/40 bg-red-50 p-6 shadow-xl sm:rounded-3xl">
                <p className="text-sm text-slate-400">Precio Final</p>
                <p className="mt-1 text-xs text-slate-500">Elegí cómo vas a pagar para pedir la cotización.</p>
                <div className="mt-3 space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("efectivo")}
                    aria-pressed={paymentMethod === "efectivo"}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${paymentMethod === "efectivo" ? "border-emerald-500 bg-white ring-2 ring-emerald-500" : "border-emerald-200 bg-white hover:border-emerald-400"}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Efectivo / Transferencia</p>
                    <p className="mt-1 font-display text-2xl font-bold text-emerald-700 sm:text-3xl">
                      {itemsGrossTotal > 0 ? formatPrice(itemsGrossTotal) : "A confirmar"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Pagando en efectivo o transferencia bancaria.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("tarjeta")}
                    aria-pressed={paymentMethod === "tarjeta"}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${paymentMethod === "tarjeta" ? "border-secondary bg-white ring-2 ring-secondary" : "border-slate-200 bg-white hover:border-secondary/60"}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Tarjeta de crédito</p>
                    <p className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                      {isComponentSelectionComplete && installmentTotal > 0 ? `$${installmentTotal.toLocaleString("es-AR")}` : "A confirmar"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">En 3/6 cuotas sin interés con VISA o Mastercard.</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex h-8 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/pagos/visa.svg" alt="Visa" className="max-h-5 max-w-full object-contain" />
                      </div>
                      <div className="flex h-8 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/pagos/mastercard.svg" alt="Mastercard" className="max-h-5 max-w-full object-contain" />
                      </div>
                    </div>
                  </button>
                </div>
                <AnimatedButton
                  type="button"
                  onClick={sendQuote}
                  disabled={!paymentMethod}
                  className="mt-7 w-full gap-2 bg-secondary py-6 text-base font-bold text-slate-950 shadow-lg shadow-secondary/20 hover:bg-secondary/90"
                >
                  <Send size={18} /> Pedir cotización
                </AnimatedButton>
              </aside>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="gap-2 border-slate-600 bg-transparent text-white hover:bg-white/10"
              >
                <ArrowLeft size={17} /> Editar accesorios
              </Button>
              <Button
                type="button"
                onClick={reset}
                className="gap-2 bg-white/10 text-white hover:bg-white/20"
              >
                <RotateCcw size={16} /> Empezar de nuevo
              </Button>
            </div>
          </div>
        )}
      </div>
      {selectedGroups.length > 0 && <aside aria-label="Total de tu configuración" className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-4 shadow-lg"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4"><div><p className="text-xs text-slate-600">{isComponentSelectionComplete ? "Selección de componentes completa" : "Selección parcial · seguí sumando componentes"}</p><p className="mt-1 text-sm font-semibold">Total estimado {paymentMethod === "tarjeta" ? "con tarjeta" : "en efectivo / transferencia"}</p></div><strong className="shrink-0 text-lg text-primary sm:text-2xl">{formatPrice(selectedTotal)}</strong></div></aside>}
      {currentGroup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="component-dialog-title"
          ref={componentDialogRef}
        >
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-red-200 bg-white p-4 text-slate-900 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl sm:p-7">
            <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-start justify-between gap-3 border-b border-red-100 bg-white px-4 py-4 sm:-mx-7 sm:-mt-7 sm:gap-4 sm:px-7 sm:py-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Seleccionar componente
                </p>
                <h2
                  id="component-dialog-title"
                  className="mt-1 font-display text-2xl font-bold"
                >
                  {currentGroup.label}
                </h2>
                <label className="mt-3 block text-sm">Buscar componente<input value={componentSearch} onChange={event => setComponentSearch(event.target.value)} placeholder="Nombre o característica" className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
              </div>
              <button
                type="button"
                onClick={() => setOpenGroup(null)}
                aria-label="Cerrar selector"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-red-200 text-slate-500 transition hover:border-secondary hover:bg-red-50 hover:text-slate-900"
              >
                <X size={19} />
              </button>
            </div>
            {componentSearch && !orderedOptions.some(option => `${option.name} ${option.detail || ""}`.toLowerCase().includes(componentSearch.toLowerCase())) && <p role="status" className="mt-5 text-sm text-slate-600">No encontramos componentes con esa búsqueda.</p>}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {orderedOptions.filter(option => `${option.name} ${option.detail || ""}`.toLowerCase().includes(componentSearch.toLowerCase())).map((option) => {
                const index = currentGroup.options.indexOf(option);
                const compatible = isCompatible(currentGroup, option);
                return (
                <button
                  key={option.name}
                  type="button"
                  disabled={!compatible}
                  onClick={() => {
                    if (currentGroup.key === "memory") {
                      const reachesLimit = selectedMemorySlots.length + 1 >= maxMemorySlots;
                      setSelectedMemorySlots((slots) => {
                        if (slots.length >= maxMemorySlots) return slots;
                        return [...slots, index];
                      });
                      setSelected((value) => ({ ...value, memory: index }));
                      if (reachesLimit) setOpenGroup(null);
                      return;
                    }
                    setSelected((value) => {
                      const next = { ...value, [currentGroup.key]: index };
                      if (currentGroup.key === "motherboard") {
                        delete next.memory;
                        setSelectedMemorySlots([]);
                      }
                      if (currentGroup.key === "processor") {
                        delete next.motherboard;
                        delete next.memory;
                        setSelectedMemorySlots([]);
                        const graphicsGroup = catalogGroups.find((group) => group.key === "graphics");
                        const selectedGraphics = graphicsGroup?.options[next.graphics ?? 0];
                        if (selectedGraphics?.name === "Graficos integrados") delete next.graphics;
                      }
                      return next;
                    });
                    setOpenGroup(null);
                  }}
                  className={`group flex w-full min-w-0 min-h-32 items-stretch justify-between gap-2 overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 ${compatible ? "border-red-100 bg-white hover:-translate-y-1 hover:border-secondary hover:bg-red-50 hover:shadow-lg hover:shadow-red-100" : "cursor-not-allowed border-red-100 bg-red-50 opacity-40"} ${selected[currentGroup.key] === index || (currentGroup.key === "memory" && selectedMemorySlots.includes(index)) ? "border-secondary bg-red-50" : ""}`}
                >
                  <span className="flex min-w-0 flex-1 items-stretch gap-2 sm:gap-3">
                    <span className="component-image-slot shrink-0">
                      <img
                        src={option.image}
                        alt={`Imagen de ${option.name}`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/api/assets/placeholder.svg";
                        }}
                      />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col justify-center">
                      <span className="block break-words font-semibold">{option.name}</span>
                      {option.detail && <span className="mt-1 block break-words text-sm text-slate-400">{option.detail}</span>}
                      {option.precio !== undefined && (
                        <>
                          <span className="mt-2 block text-sm font-bold text-emerald-700">Precio: {formatPrice(parsePrice(option.precio))}</span>
                          <span className="mt-1 block text-xs text-slate-500">Sin impuestos nac.: ${calculateNationalPrice(parsePrice(option.precio)).toLocaleString("es-AR")}</span>
                        </>
                      )}
                      {!compatible && (
                        <span className="mt-2 block text-xs font-bold uppercase tracking-wide text-red-400">
                          {currentGroup.key === "memory" ? (selectedMemorySlots.length >= maxMemorySlots ? `Ya ocupaste los ${maxMemorySlots} slots de memoria. Quitá un módulo para elegir otro.` : "El tipo de memoria o su plataforma no coincide con tu selección.") : currentGroup.key === "processor" || currentGroup.key === "motherboard" ? "El socket no coincide con el procesador o la motherboard elegidos." : currentGroup.key === "power" ? "La potencia es menor a la recomendada para la placa de video elegida." : currentGroup.key === "storage" ? "La motherboard seleccionada no registra puertos para esta interfaz." : currentGroup.key === "case" ? "El gabinete no admite el formato de la motherboard elegida." : currentGroup.key === "cooling" ? "El socket o la altura del cooler no se ajusta a tu configuración." : "Revisá gráficos integrados, potencia de la fuente y espacio disponible en el gabinete."}
                        </span>
                      )}
                    </span>
                  </span>
                  {(selected[currentGroup.key] === index || (currentGroup.key === "memory" && selectedMemorySlots.includes(index))) && (
                    <Check className="shrink-0 text-secondary" size={20} />
                  )}
                </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {currentExtra && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="extra-dialog-title" ref={extraDialogRef}>
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-red-200 bg-white p-4 text-slate-900 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Seleccionar periferico</p><h2 id="extra-dialog-title" className="mt-1 font-display text-2xl font-bold">{currentExtra.label}</h2></div>
              <button type="button" onClick={() => setOpenExtra(null)} aria-label="Cerrar selector" className="text-slate-400 hover:text-white"><X size={21} /></button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {currentExtraOptions.map((option, index) => {
                const active = selectedExtras.includes(currentExtra.key) && selectedExtraModels[currentExtra.key] === index;
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => {
                      setSelectedExtras((value) => value.includes(currentExtra.key) ? value : [...value, currentExtra.key]);
                      setSelectedExtraModels((value) => ({ ...value, [currentExtra.key]: index }));
                      setOpenExtra(null);
                    }}
                    className={`group flex min-h-32 w-full items-stretch gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:border-secondary hover:bg-red-50 ${active ? "border-secondary bg-red-50" : "border-red-100 bg-white"}`}
                  >
                    <span className="component-image-slot">
                      <img
                        src={option.image}
                        alt={`Imagen de ${option.name}`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/api/assets/placeholder.svg";
                        }}
                      />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col justify-center">
                      <span className="block font-semibold">{option.name}</span>
                      {option.detail && <span className="mt-1 block text-sm text-slate-400">{option.detail}</span>}
                      {option.precio !== undefined && (
                        <>
                          <span className="mt-2 block text-sm font-bold text-emerald-700">Precio: {formatPrice(parsePrice(option.precio))}</span>
                          <span className="mt-1 block text-xs text-slate-500">Sin impuestos nac.: ${calculateNationalPrice(parsePrice(option.precio)).toLocaleString("es-AR")}</span>
                        </>
                      )}
                    </span>
                    {active && <Check className="shrink-0 text-secondary" size={20} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {infoPc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="ready-pc-title" ref={infoDialogRef}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-red-200 bg-white p-5 text-slate-900 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Configuración recomendada</p><h2 id="ready-pc-title" className="mt-1 font-display text-2xl font-bold">{infoPc.name}</h2><p className="mt-1 text-sm text-slate-400">{infoPc.detail}</p></div>
              <button type="button" onClick={() => setInfoPc(null)} aria-label="Cerrar información" className="text-slate-400 hover:text-white"><X size={21} /></button>
            </div>
            <div className="mt-6 space-y-3">
              {getPresetOptions(infoPc).map((component, componentIndex) => (
                <div key={`${component.key}-${componentIndex}`} className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 p-3 transition-colors hover:border-secondary/60 hover:bg-red-100 sm:p-4">
                  <div className="component-image-slot h-20 w-20 shrink-0 flex-basis-auto rounded-lg sm:h-24 sm:w-24">{component.option?.image ? <img src={component.option.image} alt={`Imagen de ${component.label}`} /> : <span className="px-2 text-center text-xs font-semibold text-slate-400">{component.unavailable || "Disponible"}</span>}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{component.label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-white sm:text-base">{component.option?.name || component.unavailable || "Disponible para elegir"}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setInfoPc(null)} className="border-slate-600 bg-transparent text-white hover:bg-white/10">Cerrar</Button><Button type="button" onClick={() => quotePreset(infoPc)} className="gap-2 bg-secondary text-slate-950 hover:bg-secondary/90">Cotizar <Send size={16} /></Button></div>
          </div>
        </div>
      )}
      <PedidoCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={armarPedidoItems}
        total={selectedTotal}
        numeroPedido={pedidoNumero}
        origen="armado"
      />
    </motion.main>
  );
};

export default ArmarPc;
