import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { storageObjectUrl } from "@/hooks/use-storage-url";
import {
  catalogProductImage,
  componentCatalogSources,
  loadComponentCatalog,
  matchesMonitorProduct,
  matchesProductKeywords,
  matchesSpeakerProduct,
  type CatalogProduct,
} from "@/lib/pc-catalog";
import { calculateNationalPrice } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Fan,
  Gamepad2,
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
  Speaker,
  X,
  Zap,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { isPcArmadaCategoryValue } from "@/lib/utils";

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
  "monitor" | "speakers" | "headphones" | "mouse" | "keyboard" | "pad";
type Option = {
  name: string;
  detail: string;
  precio?: number;
  image?: string;
  platform?: string;
  memoryType?: string;
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

const catalogSources = {
  ...componentCatalogSources,
  peripherals: "PERIFERICO",
} as const;

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

const resolveImageUrl = (path: string) => {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : storageObjectUrl(path.replace(/^\//, ""));
};

const formatPrice = (price?: number) =>
  price === undefined || !Number.isFinite(Number(price))
    ? "Precio a confirmar"
    : `$${Number(price).toLocaleString("es-AR")}`;

const normalizePlatform = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.replace(/\s/g, "").toUpperCase();
  if (normalized === "S1851" || normalized === "LGA1851") return "S1851";
  if (normalized === "S1700" || normalized === "LGA1700") return "S1700";
  return normalized;
};

const getPlatform = (option: Option) => normalizePlatform(option.platform ?? `${option.name} ${option.detail}`.match(/AM[45]|S\d{4}|LGA\s?\d+/i)?.[0]);
const getMemoryType = (option: Option) => option.memoryType ?? `${option.name} ${option.detail}`.match(/DDR[45]/i)?.[0].toUpperCase();
const hasIntegratedGraphics = (option?: Option) => {
  if (!option) return false;
  const description = `${option.name} ${option.detail}`;
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
const mapProduct = (product: CatalogProduct, key: ComponentKey | ExtraKey, folder: string): Option => ({
  name: product.nombre,
  detail: "",
  precio: product.precio,
  image: catalogProductImage(product, folder) || undefined,
  platform: normalizePlatform(product.nombre.match(/AM[45]|S\d{4}|LGA\s?\d+/i)?.[0]),
  memoryType: product.nombre.match(/DDR[45]/i)?.[0].toUpperCase(),
});

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
    key: "speakers",
    label: "Parlantes",
    icon: Speaker,
    option: {
      name: "Parlantes 2.1",
      detail: "Sonido stereo - Conexion auxiliar",
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
    key: "keyboard",
    label: "Teclado",
    icon: Keyboard,
    option: {
      name: "Teclado mecanico",
      detail: "Retroiluminado - Layout espanol",
    },
  },
  {
    key: "pad",
    label: "Pad",
    icon: Gamepad2,
    option: {
      name: "Pad gamer XL",
      detail: "Superficie de tela - Base antideslizante",
    },
  },
];
const ArmarPc = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<
    Partial<Record<ComponentKey, number>>
  >({});
  const [selectedExtras, setSelectedExtras] = useState<ExtraKey[]>([]);
  const [selectedExtraModels, setSelectedExtraModels] = useState<Partial<Record<ExtraKey, number>>>({});
  const [openGroup, setOpenGroup] = useState<ComponentKey | null>(null);
  const [infoPc, setInfoPc] = useState<PresetPc | null>(null);
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [openExtra, setOpenExtra] = useState<ExtraKey | null>(null);
  const [catalogGroups, setCatalogGroups] = useState(groups);
  const [catalogExtras, setCatalogExtras] = useState(extras);
  const [catalogExtraOptions, setCatalogExtraOptions] = useState<Partial<Record<ExtraKey, Option[]>>>({});
  const [editablePresets, setEditablePresets] = useState<Record<string, SavedPreset>>({});

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
    const unsubscribe = onSnapshot(
      collection(db, "equipos_stock"),
      (snapshot) => {
        const presets = Object.fromEntries(
          snapshot.docs
            .map((document) => [document.id, document.data()] as const)
            .filter(([, equipment]) => isPcArmadaCategoryValue(String(equipment.categoria ?? "")))
            .map(([id, equipment]) => [id, {
              name: equipment.nombre,
              detail: equipment.detail,
              image: equipment.imagen,
              promo: Number(equipment.promo || 0),
              recomendada: Boolean(equipment.recomendada),
              componentes: equipment.componentes,
            }]),
        );
        setEditablePresets(presets);
      },
      () => setEditablePresets({}),
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadCatalog = async () => {
      const componentCatalog = await loadComponentCatalog();
      const entries = await Promise.all(
        Object.entries(catalogSources).map(async ([key, folder]) => {
          if (key in componentCatalogSources) {
            return [key, componentCatalog[key as keyof typeof componentCatalog]] as const;
          }
          const response = await fetch(storageObjectUrl(`${folder}/productos.json`));
          if (!response.ok) return [key, []] as const;
          return [key, (await response.json()) as CatalogProduct[]] as const;
        }),
      );
      const productMap = Object.fromEntries(entries) as Record<string, CatalogProduct[]>;
      const loadedGroups = groups.map((group) => ({
        ...group,
        options: productMap[group.key]
            ? productMap[group.key].map((product) => mapProduct(product, group.key, catalogSources[group.key]))
          : group.options,
          }));
      setCatalogGroups(loadedGroups);
      const peripheralProducts = productMap.peripherals ?? [];
      const monitorProducts = peripheralProducts.filter((product) => matchesMonitorProduct(product.nombre));
      const accessoryMatchers: Record<ExtraKey, (productName: string) => boolean> = {
        monitor: matchesMonitorProduct,
        speakers: matchesSpeakerProduct,
        headphones: (productName) => matchesProductKeywords(productName, ["auricular", "auriculares", "headset"]),
        mouse: (productName) => matchesProductKeywords(productName, ["mouse", "raton"]),
        keyboard: (productName) => matchesProductKeywords(productName, ["teclado", "keyboard"]),
        pad: (productName) => matchesProductKeywords(productName, ["pad", "almohadilla", "mousepad"]),
      };
      const loadedExtras = extras.map((extra) => {
        const source = extra.key === "monitor"
          ? monitorProducts[0]
          : peripheralProducts.find((product) => accessoryMatchers[extra.key](product.nombre));
        return source ? { ...extra, option: mapProduct(source, extra.key, catalogSources.peripherals) } : extra;
      });
      setCatalogExtras(loadedExtras);
      const peripheralOptions = Object.entries(accessoryMatchers).map(([key, matcher]) => [
        key,
        ((key === "monitor" ? monitorProducts : peripheralProducts.filter((product) => matcher(product.nombre))))
          .map((product) => mapProduct(product, key as ExtraKey, catalogSources.peripherals)),
      ]);
      setCatalogExtraOptions(Object.fromEntries(peripheralOptions) as Partial<Record<ExtraKey, Option[]>>);
    };
    void loadCatalog();
  }, []);
  const selectedGroups = catalogGroups.filter(
    (group) => selected[group.key] !== undefined,
  );
  const orderedGroups = [...catalogGroups].sort((left, right) => {
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
  useEffect(() => {
    if (step !== 1) return;
    const interval = window.setInterval(() => {
      setActivePresetIndex((index) => (index + 1) % Math.max(availablePcs.length, 1));
    }, 5000);
    return () => window.clearInterval(interval);
  }, [availablePcs.length, step]);
  const currentExtra = catalogExtras.find((extra) => extra.key === openExtra);
  const currentExtraOptions = openExtra ? catalogExtraOptions[openExtra] ?? [currentExtra?.option].filter(Boolean) as Option[] : [];
  const selectedProcessor = catalogGroups.find((group) => group.key === "processor")?.options[selected.processor ?? 0];
  const requiresDedicatedGraphics = selectedProcessor !== undefined && !hasIntegratedGraphics(selectedProcessor);
  const requiredGroups = orderedGroups.filter((group) => group.key !== "graphics" || requiresDedicatedGraphics);
  const isComponentSelectionComplete = requiredGroups.every((group) => selected[group.key] !== undefined);
  const graphicsSummary = selected.graphics !== undefined
    ? catalogGroups.find((group) => group.key === "graphics")?.options[selected.graphics]?.name
    : "Sin placa dedicada (usa los gráficos del procesador)";
  const isCompatible = (group: Group, option: Option) => {
    if (group.key === "memory") {
      const motherboard = catalogGroups.find((item) => item.key === "motherboard");
      const motherboardOption = motherboard && selected.motherboard !== undefined
        ? motherboard.options[selected.motherboard]
        : undefined;
      const motherboardMemory = motherboardOption && getMemoryType(motherboardOption);
      return !motherboardMemory || !getMemoryType(option) || getMemoryType(option) === motherboardMemory;
    }

    if (group.key !== "motherboard" && group.key !== "processor") {
      return group.key !== "graphics"
        || option.name !== "Graficos integrados"
        || hasIntegratedGraphics(selectedProcessor);
    }

    const relatedKey = group.key === "motherboard" ? "processor" : "motherboard";
    const relatedGroup = catalogGroups.find((item) => item.key === relatedKey);
    const relatedOption = relatedGroup && selected[relatedKey] !== undefined
      ? relatedGroup.options[selected[relatedKey] ?? 0]
      : undefined;

    if (!relatedOption?.platform) return true;
    return !getPlatform(option) || getPlatform(option) === normalizePlatform(relatedOption.platform);
  };
  const orderedOptions = currentGroup
    ? [...currentGroup.options].sort((left, right) => Number(isCompatible(currentGroup, right)) - Number(isCompatible(currentGroup, left)))
    : [];
  const nationalTotal = useMemo(
    () => selectedGroups.reduce((sum, group) => sum + Number(group.options[selected[group.key] ?? 0].precio || 0), 0)
      + selectedExtras.reduce((sum, key) => sum + Number(catalogExtraOptions[key]?.[selectedExtraModels[key] ?? 0]?.precio || catalogExtras.find((item) => item.key === key)?.option.precio || 0), 0),
    [catalogExtraOptions, catalogExtras, selected, selectedExtras, selectedExtraModels, selectedGroups],
  );
  const reset = () => {
    setSelected({});
    setSelectedExtras([]);
    setSelectedExtraModels({});
    setStep(1);
    setOpenGroup(null);
    setOpenExtra(null);
  };
  const sendQuote = () => {
    const parts = orderedGroups
      .filter((group) => selected[group.key] !== undefined)
      .map((group) => `${group.label}: ${group.options[selected[group.key] ?? 0].name}`);
    if (selected.graphics === undefined) parts.push(`Placa de video: ${graphicsSummary}`);
    const accessories =
      selectedExtras
        .map((key) => `${catalogExtras.find((item) => item.key === key)?.label}: ${catalogExtraOptions[key]?.[selectedExtraModels[key] ?? 0]?.name ?? "Seleccionado"}`)
        .join(", ") || "Ninguno";
    const message = `Hola ServiTec, quiero cotizar esta PC armada:%0A${parts.join("%0A")}%0AAccesorios: ${accessories}`;
    window.open(
      `https://wa.me/5491124873190?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  return (
    <main className="pc-builder relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute left-[39%] top-1/2 hidden h-[900px] w-[900px] -translate-y-1/2 rounded-full border border-dashed border-red-200/60 xl:block" />
      <div className="pointer-events-none absolute left-[35%] top-1/2 hidden h-[650px] w-[650px] -translate-y-1/2 rounded-full border border-red-100 xl:block" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={18} /> Volver
          </button>
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ServiTec"
              className="h-10 w-10 object-contain"
            />
            <span className="hidden font-display text-lg font-bold sm:block">
              Servi<span className="text-primary">Tec</span>
            </span>
            <span className="border-l border-white/5 pl-3 text-xs uppercase tracking-[0.2em] text-slate-890">
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
        <nav className="mx-auto mt-6 flex items-center justify-center">
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
                  className={`mx-3 h-px w-12 sm:w-20 ${item.number < step ? "bg-secondary" : "bg-slate-600"}`}
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
                  No hay configuraciones recomendadas disponibles.
                </p>
              )}
              <div className="mx-auto mt-7 grid max-w-3xl gap-2 text-left sm:grid-cols-2">
                {orderedGroups.map((group) => {
                  const Icon = group.icon;
                  const value = selected[group.key];
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => setOpenGroup(group.key)}
                      className={`flex items-center gap-3 rounded-xl border border-red-100 bg-white p-3 text-left transition-colors hover:border-secondary/70 hover:bg-red-50 ${value !== undefined ? "border-secondary/60 bg-red-50" : ""}`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${value !== undefined ? "bg-secondary text-slate-950" : "bg-red-50 text-red-800"}`}>
                        {value !== undefined ? <Check size={19} /> : <Icon size={19} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{group.label}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {value !== undefined ? group.options[value].name : group.key === "graphics" && !requiresDedicatedGraphics ? "Opcional con gráficos integrados" : "Seleccioná una opción"}
                        </span>
                      </span>
                      <ArrowRight size={15} className="ml-auto shrink-0 text-slate-500" />
                    </button>
                  );
                })}
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
                          {group.options[selected[group.key] ?? 0].name}
                        </p>
                        {group.options[selected[group.key] ?? 0].precio !== undefined && (
                          <>
                            <p className="text-sm font-semibold text-emerald-700">
                              Precio: {formatPrice(group.options[selected[group.key] ?? 0].precio)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Sin impuestos nac.: ${calculateNationalPrice(Number(group.options[selected[group.key] ?? 0].precio)).toLocaleString("es-AR")}
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
                                  Precio: {formatPrice(extraOption.precio)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Sin impuestos nac.: ${calculateNationalPrice(Number(extraOption.precio)).toLocaleString("es-AR")}
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
                <p className="mt-1 font-display text-2xl font-bold text-emerald-700 sm:text-3xl">
                  {nationalTotal > 0 ? `$${nationalTotal.toLocaleString("es-AR")}` : "A confirmar"}
                </p>
                {nationalTotal > 0 && <p className="mt-1 text-xs text-slate-500">Sin impuestos nac.: ${calculateNationalPrice(nationalTotal).toLocaleString("es-AR")}</p>}
                <Button
                  type="button"
                  onClick={sendQuote}
                  className="mt-7 w-full gap-2 bg-secondary py-6 text-base font-bold text-slate-950 shadow-lg shadow-secondary/20 hover:bg-secondary/90"
                >
                  <Send size={18} /> Pedir cotización
                </Button>
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
      {currentGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="component-dialog-title"
        >
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-red-200 bg-white p-5 text-slate-900 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between">
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
              </div>
              <button
                type="button"
                onClick={() => setOpenGroup(null)}
                aria-label="Cerrar selector"
                className="text-slate-400 hover:text-white"
              >
                <X size={21} />
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {orderedOptions.map((option) => {
                const index = currentGroup.options.indexOf(option);
                const compatible = isCompatible(currentGroup, option);
                return (
                <button
                  key={option.name}
                  type="button"
                  disabled={!compatible}
                  onClick={() => {
                    setSelected((value) => {
                      const next = { ...value, [currentGroup.key]: index };
                      if (currentGroup.key === "motherboard") {
                        delete next.memory;
                      }
                      if (currentGroup.key === "processor") {
                        delete next.motherboard;
                        delete next.memory;
                        const graphicsGroup = catalogGroups.find((group) => group.key === "graphics");
                        const selectedGraphics = graphicsGroup?.options[next.graphics ?? 0];
                        if (selectedGraphics?.name === "Graficos integrados") delete next.graphics;
                      }
                      return next;
                    });
                    setOpenGroup(null);
                  }}
                  className={`group flex w-full min-h-32 items-stretch justify-between gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 ${compatible ? "border-red-100 bg-white hover:-translate-y-1 hover:border-secondary hover:bg-red-50 hover:shadow-lg hover:shadow-red-100" : "cursor-not-allowed border-red-100 bg-red-50 opacity-40"} ${selected[currentGroup.key] === index ? "border-secondary bg-red-50" : ""}`}
                >
                  <span className="flex min-w-0 flex-1 items-stretch gap-3">
                    <span className="component-image-slot">
                      <img
                        src={option.image}
                        alt={`Imagen de ${option.name}`}
                      />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col justify-center">
                      <span className="block font-semibold">{option.name}</span>
                      {option.detail && <span className="mt-1 block text-sm text-slate-400">{option.detail}</span>}
                      {option.precio !== undefined && (
                        <span className="mt-2 block text-sm font-bold text-emerald-700">
                          Precio: {formatPrice(option.precio)}
                        </span>
                      )}
                      {option.precio !== undefined && (
                        <span className="mt-1 block text-xs text-slate-500">
                          Sin impuestos nac.: ${calculateNationalPrice(Number(option.precio)).toLocaleString("es-AR")}
                        </span>
                      )}
                      {!compatible && (
                        <span className="mt-2 block text-xs font-bold uppercase tracking-wide text-red-400">
                          No compatible con tu selección
                        </span>
                      )}
                    </span>
                  </span>
                  {selected[currentGroup.key] === index && (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="extra-dialog-title">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-red-200 bg-white p-5 text-slate-900 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Seleccionar periferico</p><h2 id="extra-dialog-title" className="mt-1 font-display text-2xl font-bold">{currentExtra.label}</h2></div>
              <button type="button" onClick={() => setOpenExtra(null)} aria-label="Cerrar selector" className="text-slate-400 hover:text-white"><X size={21} /></button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {currentExtraOptions.map((option, index) => {
                const active = selectedExtras.includes(currentExtra.key) && selectedExtraModels[currentExtra.key] === index;
                return <button key={option.name} type="button" onClick={() => { setSelectedExtras((value) => value.includes(currentExtra.key) ? value : [...value, currentExtra.key]); setSelectedExtraModels((value) => ({ ...value, [currentExtra.key]: index })); setOpenExtra(null); }} className={`group flex min-h-32 w-full items-stretch gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:border-secondary hover:bg-red-50 ${active ? "border-secondary bg-red-50" : "border-red-100 bg-white"}`}>
                  <span className="component-image-slot"><img src={option.image} alt={`Imagen de ${option.name}`} /></span>
                  <span className="flex min-w-0 flex-1 flex-col justify-center"><span className="block font-semibold">{option.name}</span>{option.detail && <span className="mt-1 block text-sm text-slate-400">{option.detail}</span>}{option.precio !== undefined && <><span className="mt-2 block text-sm font-bold text-emerald-700">Precio: {formatPrice(option.precio)}</span><span className="mt-1 block text-xs text-slate-500">Sin impuestos nac.: ${calculateNationalPrice(Number(option.precio)).toLocaleString("es-AR")}</span></>}</span>
                  {active && <Check className="shrink-0 text-secondary" size={20} />}
                </button>;
              })}
            </div>
          </div>
        </div>
      )}
      {infoPc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="ready-pc-title">
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
    </main>
  );
};

export default ArmarPc;
