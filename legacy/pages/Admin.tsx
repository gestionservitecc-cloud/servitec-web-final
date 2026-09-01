import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  where
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth, functions } from "../lib/firebase";
import { httpsCallable } from "firebase/functions";

async function uploadImageToBlob(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo subir la imagen a Vercel Blob.");
  return data.url as string;
}
import AdminLogin from "./AdminLogin";
import { catalogProductImage, componentCatalogLabels, componentCatalogSources, loadComponentCatalog, type ComponentCatalogKey, type CatalogProduct } from "@/lib/pc-catalog";
import { Boxes, LayoutDashboard, LoaderCircle } from "lucide-react";
import {
  isAccessoryCategoryValue,
  isPcArmadaCategoryValue,
  normalizeCsvProductName,
  normalizeStockCategoryValue,
  shouldIgnoreCsvProduct
} from "../lib/utils";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  precioCosto: number;
  stock: number;
  imagen: string;
}

interface EquipoStock {
  id: string;
  nombre: string;
  categoria?: StockCategory | string;
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  procesador?: string;
  pantalla?: string;
  sistema?: string;
  pulgadas?: string;
  placaVideo?: string;
  detail?: string;
  presetId?: string;
  upc?: string;
  distribucionTeclado?: string;
  tecladoRetroiluminado?: string;
  lectorOptico?: string;
  lectorTarjetas?: string;
  webcam?: string;
  usb?: string;
  rj45?: string;
  wifi?: string;
  bluetooth?: string;
  vga?: string;
  hdmi?: string;
  audio?: string;
  bateria?: string;
  origen?: string;
  warranty: string;
  condition: "Sellado" | "Reacondicionado" | string;
  original: number;
  promo: number;
  imagen: string;
  imagenes?: string[];
  componentes?: EquipoComponent[];
  recomendada?: boolean;
  estado: "disponible" | "vendido" | string;
  notas?: string;
  vendidoAt?: { toDate?: () => Date } | null;
}

interface EquipoComponent {
  key: string;
  label: string;
  nombre: string;
  detalle: string;
  imagen: string;
  precio?: number;
  cantidad?: number;
}

interface Movimiento {
  tipo: "entrada" | "salida" | "venta" | string;
  producto: string;
  cantidad: number;
  total?: number;
  precioUnitario?: number;
  fecha?: { toDate?: () => Date };
  usuario?: string;
  origen?: string;
}

interface ResumenFinancieroDiario {
  fecha: string;
  facturacion: number;
  costo: number;
  ganancia: number;
  ventas: number;
  unidadesVendidas: number;
}

interface AjustePrecioSnapshot {
  timestamp: number;
  cambios: Array<{
    id: string;
    precioAnterior: number;
    precioNuevo: number;
  }>;
}

interface ConfirmacionAjustePrecio {
  accion: "incremento" | "decremento" | "deshacer";
  porcentaje?: number;
  cambios: AjustePrecioSnapshot["cambios"];
}

type Role = "admin" | "viewer";
type UiMessage = { type: "success" | "error" | "info"; text: string };
type AdminSegment = "dashboard" | "stock";
type StockType = "nuevos" | "reacondicionados";
type StockCategory = "celular" | "notebook" | "tablet" | "pc" | "pc-armada" | "tv";
type StockFieldKey = "marca" | "modelo" | "almacenamiento" | "ram" | "procesador" | "pantalla" | "sistema" | "pulgadas" | "placaVideo" | "warranty";
type NotebookExtraKey = "upc" | "distribucionTeclado" | "tecladoRetroiluminado" | "lectorOptico" | "lectorTarjetas" | "webcam" | "usb" | "rj45" | "wifi" | "bluetooth" | "vga" | "hdmi" | "audio" | "bateria" | "origen";
type EquipoForm = {
  categoria: StockCategory;
  nombre: string;
  marca: string;
  modelo: string;
  almacenamiento: string;
  ram: string;
  procesador: string;
  pantalla: string;
  sistema: string;
  pulgadas: string;
  placaVideo: string;
  warranty: string;
  upc: string;
  distribucionTeclado: string;
  tecladoRetroiluminado: string;
  lectorOptico: string;
  lectorTarjetas: string;
  webcam: string;
  usb: string;
  rj45: string;
  wifi: string;
  bluetooth: string;
  vga: string;
  hdmi: string;
  audio: string;
  bateria: string;
  origen: string;
  condition: string;
  detail: string;
  presetId: string;
  componentes: EquipoComponent[];
  recomendada: boolean;
  original: string;
  promo: string;
  estado: string;
  notas: string;
};

const STOCK_CATEGORIES: Array<{ id: StockCategory; label: string }> = [
  { id: "celular", label: "Celular" },
  { id: "notebook", label: "Notebook" },
  { id: "tablet", label: "Tablet" },
  { id: "pc", label: "PC" },
  { id: "pc-armada", label: "PC armada" },
  { id: "tv", label: "TV" }
];

const PC_COMPONENT_GROUPS = Object.keys(componentCatalogSources) as ComponentCatalogKey[];

const STOCK_FIELDS: Record<StockCategory, Array<{ key: StockFieldKey; label: string }>> = {
  celular: [
    { key: "marca", label: "Marca" }, { key: "modelo", label: "Modelo" },
    { key: "almacenamiento", label: "Almacenamiento" }, { key: "ram", label: "RAM" },
    { key: "pantalla", label: "Pantalla" }, { key: "sistema", label: "Sistema operativo" },
    { key: "warranty", label: "Garantía" }
  ],
  notebook: [
    { key: "marca", label: "Marca" }, { key: "modelo", label: "Modelo" },
    { key: "procesador", label: "Procesador" }, { key: "ram", label: "RAM" },
    { key: "almacenamiento", label: "Almacenamiento" }, { key: "pantalla", label: "Pantalla" },
    { key: "sistema", label: "Sistema operativo" }, { key: "warranty", label: "Garantía" }
  ],
  tablet: [
    { key: "marca", label: "Marca" }, { key: "modelo", label: "Modelo" },
    { key: "almacenamiento", label: "Almacenamiento" }, { key: "ram", label: "RAM" },
    { key: "pantalla", label: "Pantalla" }, { key: "sistema", label: "Sistema operativo" },
    { key: "warranty", label: "Garantía" }
  ],
  pc: [
    { key: "marca", label: "Marca" }, { key: "modelo", label: "Modelo" },
    { key: "procesador", label: "Procesador" }, { key: "ram", label: "RAM" },
    { key: "almacenamiento", label: "Almacenamiento" }, { key: "placaVideo", label: "Placa de video" },
    { key: "warranty", label: "Garantía" }
  ],
  "pc-armada": [],
  tv: [
    { key: "marca", label: "Marca" }, { key: "modelo", label: "Modelo" },
    { key: "pulgadas", label: "Pulgadas" }, { key: "pantalla", label: "Tipo de pantalla" },
    { key: "sistema", label: "Sistema operativo" }, { key: "warranty", label: "Garantía" }
  ]
};

const NOTEBOOK_EXTRA_FIELDS: Array<{ key: NotebookExtraKey; label: string }> = [
  { key: "upc", label: "UPC / EAN" },
  { key: "distribucionTeclado", label: "Distribución teclado" },
  { key: "tecladoRetroiluminado", label: "Teclado retroiluminado" },
  { key: "lectorOptico", label: "Lector óptico" },
  { key: "lectorTarjetas", label: "Lector de tarjetas" },
  { key: "webcam", label: "Web Cam" },
  { key: "usb", label: "USB" },
  { key: "rj45", label: "RJ 45" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "bluetooth", label: "Bluetooth" },
  { key: "vga", label: "VGA" },
  { key: "hdmi", label: "HDMI" },
  { key: "audio", label: "Aur. y mic" },
  { key: "bateria", label: "Batería" },
  { key: "origen", label: "Origen" }
];

const getDefaultStockCategory = (equipo: EquipoStock): StockCategory => {
  const categoria = normalizeStockCategoryValue(equipo.categoria);
  if (categoria === "pc-armada") return "pc-armada";
  return STOCK_CATEGORIES.some((item) => item.id === categoria) ? categoria as StockCategory : "celular";
};

const CATEGORIA = [
  "ACCESORIOS",
  "ADAPTADORES",
  "ALMACENAMIENTO",
  "ARTICULOS",
  "AURICULARES",
  "CARGADORES",
  "CABLES",
  "CARGADOR NOTEBOOK",
  "CELULARES",
  "CONSOLAS",
  "HIDROGEL",
  "INSUMOS TECNICOS",
  "JOYSTICK PS4 AAA",
  "PARLANTES",
  "PERIFERICOS",
  "SOPORTES",
  "TECLADOS",
  "WEBCAM"
];

const normalizeImportedCategory = (rawCategory: string) => {
  const normalized = rawCategory.trim();
  if (!normalized) return "ARTICULO";

  const canonByUpper = new Map(CATEGORIA.map((cat) => [cat.toUpperCase(), cat]));
  return canonByUpper.get(normalized.toUpperCase()) || normalized;
};

const COLORS = ["#22c55e", "#f87171"];
const INVENTARIO_PAGE_SIZE = 24;
const HISTORIAL_PAGE_SIZE = 30;
const MAX_IMAGE_SIDE = 1200;
const WEBP_QUALITY = 0.82;

const getLocalDayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseCsvRows = (csvText: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];

    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
};

const optimizeImageForUpload = async (file: File) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = objectUrl;
    });

    const longestSide = Math.max(image.width, image.height) || 1;
    const scale = Math.min(1, MAX_IMAGE_SIDE / longestSide);
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo preparar la compresion de imagen.");
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const webpBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
    });
    if (!webpBlob) throw new Error("No se pudo convertir la imagen a WebP.");

    const baseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "producto";

    return new File([webpBlob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const blockAnimation = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const }
  }
};

const getMovimientoMeta = (tipo: string) => {
  if (tipo === "entrada") return { label: "Entrada", color: "text-emerald-700" };
  if (tipo === "salida") return { label: "Salida", color: "text-rose-700" };
  if (tipo === "venta") return { label: "Venta", color: "text-blue-700" };
  return { label: tipo, color: "text-slate-700" };
};

const getMarginData = (precioInput: number, costoInput: number) => {
  const precio = Number(precioInput);
  const costo = Number(costoInput);
  if (!precio || !costo) return { margen: 0, porcentaje: "0" };
  const margen = precio - costo;
  return { margen, porcentaje: ((margen / costo) * 100).toFixed(1) };
};

const Admin = () => {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [ventasHistoricas, setVentasHistoricas] = useState<Movimiento[]>([]);
  const [mostrarTodosMovimientos, setMostrarTodosMovimientos] = useState(false);
  const [visibleProductos, setVisibleProductos] = useState(INVENTARIO_PAGE_SIZE);
  const [visibleMovimientos, setVisibleMovimientos] = useState(HISTORIAL_PAGE_SIZE);
  const [equiposStock, setEquiposStock] = useState<EquipoStock[]>([]);
  const [visibleEquipos, setVisibleEquipos] = useState(INVENTARIO_PAGE_SIZE);
  const [activeSegment, setActiveSegment] = useState<AdminSegment>("dashboard");
  const [stockType, setStockType] = useState<StockType>("nuevos");
  const [stockCategory, setStockCategory] = useState<StockCategory>("celular");

  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    precio: "",
    precioCosto: "",
    stock: ""
  });

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cantidadVenta, setCantidadVenta] = useState<Record<string, number>>({});
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([]);
  const [porcentajeAjuste, setPorcentajeAjuste] = useState("");
  const [aplicandoAjustePrecios, setAplicandoAjustePrecios] = useState(false);
  const [historialAjustesPrecios, setHistorialAjustesPrecios] = useState<AjustePrecioSnapshot[]>([]);
  const [confirmacionAjustePrecio, setConfirmacionAjustePrecio] = useState<ConfirmacionAjustePrecio | null>(null);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const [formEdit, setFormEdit] = useState({
    nombre: "",
    categoria: "",
    precio: "",
    precioCosto: "",
    stock: ""
  });
  const [fechaConsulta, setFechaConsulta] = useState(getLocalDayKey(new Date()));
  const [resumenDiario, setResumenDiario] = useState<ResumenFinancieroDiario | null>(null);
  const [cargandoResumenDiario, setCargandoResumenDiario] = useState(false);
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const [importandoCsv, setImportandoCsv] = useState(false);
  const [sincronizandoCompragamer, setSincronizandoCompragamer] = useState(false);
  const [uiMessage, setUiMessage] = useState<UiMessage | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);
  const [equipoForm, setEquipoForm] = useState<EquipoForm>({
    categoria: "celular" as StockCategory,
    nombre: "",
    marca: "",
    modelo: "",
    almacenamiento: "",
    ram: "",
    procesador: "",
    pantalla: "",
    sistema: "",
    pulgadas: "",
    placaVideo: "",
    warranty: "",
    upc: "",
    distribucionTeclado: "",
    tecladoRetroiluminado: "",
    lectorOptico: "",
    lectorTarjetas: "",
    webcam: "",
    usb: "",
    rj45: "",
    wifi: "",
    bluetooth: "",
    vga: "",
    hdmi: "",
    audio: "",
    bateria: "",
    origen: "",
    condition: "Sellado",
    detail: "",
    presetId: "",
    componentes: [],
    recomendada: false,
    original: "",
    promo: "",
    estado: "disponible",
    notas: ""
  });
  const [equipoEditando, setEquipoEditando] = useState<EquipoStock | null>(null);
  const [equipoFormEdit, setEquipoFormEdit] = useState<EquipoForm>({
    categoria: "celular" as StockCategory,
    nombre: "",
    marca: "",
    modelo: "",
    almacenamiento: "",
    ram: "",
    procesador: "",
    pantalla: "",
    sistema: "",
    pulgadas: "",
    placaVideo: "",
    warranty: "",
    upc: "",
    distribucionTeclado: "",
    tecladoRetroiluminado: "",
    lectorOptico: "",
    lectorTarjetas: "",
    webcam: "",
    usb: "",
    rj45: "",
    wifi: "",
    bluetooth: "",
    vga: "",
    hdmi: "",
    audio: "",
    bateria: "",
    origen: "",
    condition: "Sellado",
    detail: "",
    presetId: "",
    componentes: [],
    recomendada: false,
    original: "",
    promo: "",
    estado: "disponible",
    notas: ""
  });
  const [equipoImages, setEquipoImages] = useState<File[]>([]);
  const [equipoPreviews, setEquipoPreviews] = useState<string[]>([]);
  const [equipoImagesEdit, setEquipoImagesEdit] = useState<File[]>([]);
  const [equipoPreviewsEdit, setEquipoPreviewsEdit] = useState<string[]>([]);
  const [equipoGalleryEdit, setEquipoGalleryEdit] = useState<string[]>([]);
  const [componentCatalog, setComponentCatalog] = useState<Record<ComponentCatalogKey, CatalogProduct[]>>({} as Record<ComponentCatalogKey, CatalogProduct[]>);
  const [componentPickerMode, setComponentPickerMode] = useState<"create" | "edit" | null>(null);
  const [componentPickerTab, setComponentPickerTab] = useState<ComponentCatalogKey | null>(null);
  const [componentPickerSearch, setComponentPickerSearch] = useState("");

  useEffect(() => {
    void loadComponentCatalog().then(setComponentCatalog).catch(() => setComponentCatalog({} as Record<ComponentCatalogKey, CatalogProduct[]>));
  }, []);

  useEffect(() => {
    let unsubStock: (() => void) | undefined;
    let unsubEquipos: (() => void) | undefined;
    let unsubMovimientos: (() => void) | undefined;
    let unsubVentas: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubStock?.();
      unsubEquipos?.();
      unsubMovimientos?.();
      unsubVentas?.();
      unsubStock = undefined;
      unsubEquipos = undefined;
      unsubMovimientos = undefined;
      unsubVentas = undefined;

      if (!user) {
        setIsAuth(false);
        setRole(null);
        setDataError(null);
        setProductos([]);
        setEquiposStock([]);
        setMovimientos([]);
        setVentasHistoricas([]);
        return;
      }

      setIsAuth(true);
      let snap;
      try {
        snap = await getDoc(doc(db, "users", user.uid));
      } catch (error) {
        console.error("No se pudo cargar el rol del usuario:", error);
        setDataError("No se pudo cargar la configuración del panel. Revisa tu conexión y vuelve a intentarlo.");
        setRole("viewer");
        return;
      }
      const userRole = (snap.data()?.role || "viewer") as Role;
      setRole(userRole);

      const handleDataError = (label: string) => (error: Error) => {
        console.error(`No se pudo cargar ${label}:`, error);
        setDataError(`No se pudo cargar ${label}. El resto del panel sigue disponible.`);
      };

      const stockQuery = query(collection(db, "stock"), orderBy("nombre"));
      unsubStock = onSnapshot(stockQuery, (stockSnap) => {
        const accesorios = stockSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Producto))
          .filter((producto) => isAccessoryCategoryValue(producto.categoria));

        setProductos(accesorios);
      }, handleDataError("el inventario"));

      const equiposQuery = query(collection(db, "equipos_stock"), orderBy("nombre"));
      unsubEquipos = onSnapshot(equiposQuery, (equiposSnap) => {
        setEquiposStock(equiposSnap.docs.map((d) => ({ id: d.id, ...d.data() } as EquipoStock)));
      }, handleDataError("el stock de equipos"));

      const movimientosQuery = query(
        collection(db, "movimientos"),
        orderBy("fecha", "desc"),
        limit(50)
      );
      unsubMovimientos = onSnapshot(movimientosQuery, (movSnap) => {
        setMovimientos(movSnap.docs.map((d) => d.data() as Movimiento));
      }, handleDataError("el historial de movimientos"));

      const ventasQuery = query(collection(db, "movimientos"), where("tipo", "==", "venta"));
      unsubVentas = onSnapshot(ventasQuery, (ventasSnap) => {
        setVentasHistoricas(ventasSnap.docs.map((d) => d.data() as Movimiento));
      }, handleDataError("las ventas históricas"));
    });

    return () => {
      unsubStock?.();
      unsubEquipos?.();
      unsubMovimientos?.();
      unsubVentas?.();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (!isAuth || role !== "admin") {
      setResumenDiario(null);
      setCargandoResumenDiario(false);
      return;
    }

    setCargandoResumenDiario(true);
    const resumenRef = doc(db, "resumen_financiero_diario", fechaConsulta);
    const unsubResumen = onSnapshot(
      resumenRef,
      (snap) => {
        if (!snap.exists()) {
          setResumenDiario(null);
          setCargandoResumenDiario(false);
          return;
        }

        const data = snap.data() as Partial<ResumenFinancieroDiario>;
        setResumenDiario({
          fecha: fechaConsulta,
          facturacion: Number(data.facturacion || 0),
          costo: Number(data.costo || 0),
          ganancia: Number(data.ganancia || 0),
          ventas: Number(data.ventas || 0),
          unidadesVendidas: Number(data.unidadesVendidas || 0)
        });
        setCargandoResumenDiario(false);
      },
      () => {
        setResumenDiario(null);
        setCargandoResumenDiario(false);
      }
    );

    return () => unsubResumen();
  }, [fechaConsulta, isAuth, role]);

  useEffect(() => {
    if (!uiMessage) return;
    const timeout = setTimeout(() => setUiMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [uiMessage]);

  useEffect(() => {
    const idsDisponibles = new Set(productos.map((p) => p.id));
    setProductosSeleccionados((prev) => {
      const next = prev.filter((id) => idsDisponibles.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [productos]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => () => equipoPreviews.forEach((url) => URL.revokeObjectURL(url)), [equipoPreviews]);

  useEffect(() => () => equipoPreviewsEdit.forEach((url) => URL.revokeObjectURL(url)), [equipoPreviewsEdit]);

  const abrirEditor = useCallback((producto: Producto) => {
    setProductoEditando(producto);
    setFormEdit({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: String(producto.precio),
      precioCosto: String(producto.precioCosto || 0),
      stock: String(producto.stock)
    });
  }, []);

  const selectComponentFromPicker = useCallback((mode: "create" | "edit", key: ComponentCatalogKey, product: CatalogProduct) => {
    const previousComponents = mode === "create" ? equipoForm.componentes : equipoFormEdit.componentes;
    const previousComponent = previousComponents.find((component) => component.key === key);
    const productSelection = {
      key,
      label: componentCatalogLabels[key],
      nombre: product.nombre,
      detalle: "",
      imagen: catalogProductImage(product, componentCatalogSources[key]),
      precio: Number(product.precio || 0),
      ...(key === "memory" ? { cantidad: previousComponent?.cantidad || 1 } : {})
    };

    if (mode === "create") {
      setEquipoForm((prev) => ({
        ...prev,
        componentes: [...prev.componentes.filter((component) => component.key !== key), productSelection]
      }));
    } else {
      setEquipoFormEdit((prev) => ({
        ...prev,
        componentes: [...prev.componentes.filter((component) => component.key !== key), productSelection]
      }));
    }

    setComponentPickerMode(null);
    setComponentPickerTab(null);
    setComponentPickerSearch("");
  }, [equipoForm.componentes, equipoFormEdit.componentes]);

  const guardarEdicion = useCallback(async () => {
    if (!productoEditando || role === "viewer") return;

    const stockAnterior = productoEditando.stock;
    const stockNuevo = Number(formEdit.stock);

    let imageUrl = productoEditando.imagen;
    if (image) {
      let imageToUpload = image;
      try {
        imageToUpload = await optimizeImageForUpload(image);
      } catch {
        setUiMessage({
          type: "info",
          text: "No se pudo optimizar la imagen. Se subio el archivo original."
        });
      }

      imageUrl = await uploadImageToBlob(imageToUpload);
    }

    const batch = writeBatch(db);

    batch.update(doc(db, "stock", productoEditando.id), {
      nombre: formEdit.nombre,
      categoria: formEdit.categoria,
      precio: Number(formEdit.precio),
      precioCosto: Number(formEdit.precioCosto),
      stock: stockNuevo,
      imagen: imageUrl
    });

    if (!Number.isNaN(stockNuevo) && stockNuevo !== stockAnterior) {
      batch.set(doc(collection(db, "movimientos")), {
        producto: formEdit.nombre || productoEditando.nombre,
        tipo: stockNuevo > stockAnterior ? "entrada" : "salida",
        cantidad: Math.abs(stockNuevo - stockAnterior),
        anterior: stockAnterior,
        nuevo: stockNuevo,
        usuario: auth.currentUser?.email,
        fecha: serverTimestamp()
      });
    }

    await batch.commit();

    setProductoEditando(null);
    setImage(null);
    setPreview(null);
  }, [formEdit, image, productoEditando, role]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }, [preview]);

  const handleEquipoImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    if (!files.length) return;
    setEquipoImages(files);
    setEquipoPreviews(files.map((file) => URL.createObjectURL(file)));
  }, []);

  const handleEquipoImageEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    if (!files.length) return;
    setEquipoImagesEdit(files);
    setEquipoPreviewsEdit(files.map((file) => URL.createObjectURL(file)));
    setEquipoGalleryEdit([]);
  }, []);

  const moverImagen = useCallback((index: number, direction: -1 | 1, edit = false) => {
    const reorder = <T,>(current: T[]) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    };
    if (edit) {
      setEquipoGalleryEdit((current) => reorder(current));
      setEquipoPreviewsEdit((current) => reorder(current));
      setEquipoImagesEdit((current) => reorder(current));
    } else {
      setEquipoPreviews((current) => reorder(current));
      setEquipoImages((current) => reorder(current));
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (role === "viewer") return;

      let imageUrl = "";
      if (image) {
        let imageToUpload = image;
        try {
          imageToUpload = await optimizeImageForUpload(image);
        } catch {
          setUiMessage({
            type: "info",
            text: "No se pudo optimizar la imagen. Se subio el archivo original."
          });
        }

        imageUrl = await uploadImageToBlob(imageToUpload);
      }

      const batch = writeBatch(db);
      const stockRef = doc(collection(db, "stock"));
      const movimientoRef = doc(collection(db, "movimientos"));
      const stockInicial = Number(form.stock);

      batch.set(stockRef, {
        nombre: form.nombre,
        categoria: form.categoria,
        precio: Number(form.precio),
        precioCosto: Number(form.precioCosto),
        stock: stockInicial,
        imagen: imageUrl
      });

      batch.set(movimientoRef, {
        producto: form.nombre,
        tipo: "entrada",
        cantidad: stockInicial,
        anterior: 0,
        nuevo: stockInicial,
        usuario: auth.currentUser?.email,
        fecha: serverTimestamp()
      });

      await batch.commit();

      setForm({ nombre: "", categoria: "", precio: "", precioCosto: "", stock: "" });
      setImage(null);
      setPreview(null);
    },
    [form, image, role]
  );

  const crearEquipo = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (role === "viewer") return;
      setGuardandoEquipo(true);

      try {
        const imageUrls = await Promise.all(equipoImages.map(async (file, index) => {
        let imageToUpload = file;
        try {
          imageToUpload = await optimizeImageForUpload(file);
        } catch {
          setUiMessage({
            type: "info",
            text: "No se pudo optimizar una imagen del equipo. Se subio el archivo original."
          });
        }
        return uploadImageToBlob(imageToUpload);
        }));

        const estado = equipoForm.estado || "disponible";
        await setDoc(doc(collection(db, "equipos_stock")), {
        categoria: equipoForm.categoria,
        nombre: equipoForm.nombre,
        marca: equipoForm.marca,
        modelo: equipoForm.modelo,
        almacenamiento: equipoForm.almacenamiento,
        ram: equipoForm.ram,
        procesador: equipoForm.procesador,
        pantalla: equipoForm.pantalla,
        sistema: equipoForm.sistema,
        pulgadas: equipoForm.pulgadas,
        placaVideo: equipoForm.placaVideo,
        warranty: equipoForm.warranty,
        upc: equipoForm.upc,
        distribucionTeclado: equipoForm.distribucionTeclado,
        tecladoRetroiluminado: equipoForm.tecladoRetroiluminado,
        lectorOptico: equipoForm.lectorOptico,
        lectorTarjetas: equipoForm.lectorTarjetas,
        webcam: equipoForm.webcam,
        usb: equipoForm.usb,
        rj45: equipoForm.rj45,
        wifi: equipoForm.wifi,
        bluetooth: equipoForm.bluetooth,
        vga: equipoForm.vga,
        hdmi: equipoForm.hdmi,
        audio: equipoForm.audio,
        bateria: equipoForm.bateria,
        origen: equipoForm.origen,
        condition: stockType === "reacondicionados" ? "Reacondicionado" : "Sellado",
        detail: equipoForm.detail,
        presetId: equipoForm.presetId,
        componentes: equipoForm.componentes,
        recomendada: equipoForm.recomendada,
        original: Number(equipoForm.original),
        promo: Number(equipoForm.promo),
        notas: equipoForm.notas,
        imagen: imageUrls[0] || "",
        imagenes: imageUrls,
        estado,
        vendidoAt: estado === "vendido" ? serverTimestamp() : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
        });

        setEquipoForm({
        categoria: stockCategory,
        nombre: "",
        marca: "",
        modelo: "",
        almacenamiento: "",
        ram: "",
        procesador: "",
        pantalla: "",
        sistema: "",
        pulgadas: "",
        placaVideo: "",
        warranty: "",
        upc: "",
        distribucionTeclado: "",
        tecladoRetroiluminado: "",
        lectorOptico: "",
        lectorTarjetas: "",
        webcam: "",
        usb: "",
        rj45: "",
        wifi: "",
        bluetooth: "",
        vga: "",
        hdmi: "",
        audio: "",
        bateria: "",
        origen: "",
        condition: stockType === "reacondicionados" ? "Reacondicionado" : "Sellado",
        detail: "",
        presetId: "",
        componentes: [],
        recomendada: false,
        original: "",
        promo: "",
        estado: "disponible",
        notas: ""
        });
        setEquipoImages([]);
        setEquipoPreviews([]);
        setUiMessage({ type: "success", text: "Equipo guardado correctamente." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo guardar el equipo.";
        setUiMessage({ type: "error", text: message });
      } finally {
        setGuardandoEquipo(false);
      }
    },
    [equipoForm, equipoImages, role, stockType, stockCategory]
  );

  const abrirEditorEquipo = useCallback((equipo: EquipoStock) => {
    setEquipoEditando(equipo);
    setEquipoGalleryEdit(equipo.imagenes?.length ? equipo.imagenes : equipo.imagen ? [equipo.imagen] : []);
    setEquipoFormEdit({
      categoria: getDefaultStockCategory(equipo),
      nombre: equipo.nombre || "",
      marca: equipo.marca || "",
      modelo: equipo.modelo || "",
      almacenamiento: equipo.almacenamiento || "",
      ram: equipo.ram || "",
      procesador: equipo.procesador || "",
      pantalla: equipo.pantalla || "",
      sistema: equipo.sistema || "",
      pulgadas: equipo.pulgadas || "",
      placaVideo: equipo.placaVideo || "",
      warranty: equipo.warranty || "",
      upc: equipo.upc || "",
      distribucionTeclado: equipo.distribucionTeclado || "",
      tecladoRetroiluminado: equipo.tecladoRetroiluminado || "",
      lectorOptico: equipo.lectorOptico || "",
      lectorTarjetas: equipo.lectorTarjetas || "",
      webcam: equipo.webcam || "",
      usb: equipo.usb || "",
      rj45: equipo.rj45 || "",
      wifi: equipo.wifi || "",
      bluetooth: equipo.bluetooth || "",
      vga: equipo.vga || "",
      hdmi: equipo.hdmi || "",
      audio: equipo.audio || "",
      bateria: equipo.bateria || "",
      origen: equipo.origen || "",
      condition: equipo.condition || "Sellado",
      detail: equipo.detail || "",
      presetId: equipo.presetId || "",
      componentes: equipo.componentes || [],
      recomendada: Boolean(equipo.recomendada),
      original: String(equipo.original ?? ""),
      promo: String(equipo.promo ?? ""),
      estado: (equipo.estado || "disponible") as "disponible" | "vendido" | string,
      notas: equipo.notas || ""
    });
  }, []);

  const guardarEquipoEdicion = useCallback(async () => {
    if (!equipoEditando || role === "viewer") return;

    let imageUrls = equipoGalleryEdit;
    if (equipoImagesEdit.length) {
      imageUrls = await Promise.all(equipoImagesEdit.map(async (file, index) => {
        let imageToUpload = file;
        try {
          imageToUpload = await optimizeImageForUpload(file);
        } catch {
          setUiMessage({
            type: "info",
            text: "No se pudo optimizar una imagen del equipo. Se subio el archivo original."
          });
        }
        return uploadImageToBlob(imageToUpload);
      }));
    }

    const estadoPrevio = String(equipoEditando.estado || "disponible").toLowerCase();
    const estadoNuevo = String(equipoFormEdit.estado || "disponible").toLowerCase();
    const pasaAVendido = estadoPrevio !== "vendido" && estadoNuevo === "vendido";

    await setDoc(
      doc(db, "equipos_stock", equipoEditando.id),
      {
        categoria: equipoFormEdit.categoria,
        nombre: equipoFormEdit.nombre,
        marca: equipoFormEdit.marca,
        modelo: equipoFormEdit.modelo,
        almacenamiento: equipoFormEdit.almacenamiento,
        ram: equipoFormEdit.ram,
        procesador: equipoFormEdit.procesador,
        pantalla: equipoFormEdit.pantalla,
        sistema: equipoFormEdit.sistema,
        pulgadas: equipoFormEdit.pulgadas,
        placaVideo: equipoFormEdit.placaVideo,
        warranty: equipoFormEdit.warranty,
        upc: equipoFormEdit.upc,
        distribucionTeclado: equipoFormEdit.distribucionTeclado,
        tecladoRetroiluminado: equipoFormEdit.tecladoRetroiluminado,
        lectorOptico: equipoFormEdit.lectorOptico,
        lectorTarjetas: equipoFormEdit.lectorTarjetas,
        webcam: equipoFormEdit.webcam,
        usb: equipoFormEdit.usb,
        rj45: equipoFormEdit.rj45,
        wifi: equipoFormEdit.wifi,
        bluetooth: equipoFormEdit.bluetooth,
        vga: equipoFormEdit.vga,
        hdmi: equipoFormEdit.hdmi,
        audio: equipoFormEdit.audio,
        bateria: equipoFormEdit.bateria,
        origen: equipoFormEdit.origen,
        condition: stockType === "reacondicionados" ? "Reacondicionado" : "Sellado",
        detail: equipoFormEdit.detail,
        presetId: equipoFormEdit.presetId,
        componentes: equipoFormEdit.componentes,
        recomendada: equipoFormEdit.recomendada,
        original: Number(equipoFormEdit.original),
        promo: Number(equipoFormEdit.promo),
        notas: equipoFormEdit.notas,
        imagen: imageUrls[0] || "",
        imagenes: imageUrls,
        estado: estadoNuevo,
        vendidoAt: estadoNuevo === "vendido" ? (pasaAVendido ? serverTimestamp() : equipoEditando.vendidoAt || null) : null,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    setEquipoEditando(null);
    setEquipoImagesEdit([]);
    setEquipoPreviewsEdit([]);
    setEquipoGalleryEdit([]);
  }, [equipoEditando, equipoFormEdit, equipoImagesEdit, equipoGalleryEdit, role, stockType]);

  const marcarEquipoVendido = useCallback(
    async (equipo: EquipoStock) => {
      if (role === "viewer") return;
      await setDoc(
        doc(db, "equipos_stock", equipo.id),
        { estado: "vendido", vendidoAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
    [role]
  );

  const registrarVenta = useCallback(
    async (producto: Producto, cantidad: number) => {
      if (role === "viewer" || cantidad <= 0) return;
      if (cantidad > producto.stock) {
        setUiMessage({ type: "error", text: "No hay suficiente stock para registrar esa venta." });
        return;
      }

      const nuevoStock = producto.stock - cantidad;
      const ingresoTotal = producto.precio * cantidad;
      const costoTotal = (producto.precioCosto || 0) * cantidad;
      const gananciaTotal = ingresoTotal - costoTotal;
      const dayKey = getLocalDayKey(new Date());
      const ventaBatch = writeBatch(db);
      ventaBatch.update(doc(db, "stock", producto.id), { stock: nuevoStock });
      ventaBatch.set(doc(collection(db, "movimientos")), {
        producto: producto.nombre,
        tipo: "venta",
        cantidad,
        anterior: producto.stock,
        nuevo: nuevoStock,
        precioUnitario: producto.precio,
        total: ingresoTotal,
        usuario: auth.currentUser?.email,
        fecha: serverTimestamp()
      });
      await ventaBatch.commit();

      try {
        await setDoc(
          doc(db, "resumen_financiero_diario", dayKey),
          {
            fecha: dayKey,
            facturacion: increment(ingresoTotal),
            costo: increment(costoTotal),
            ganancia: increment(gananciaTotal),
            ventas: increment(1),
            unidadesVendidas: increment(cantidad),
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch (error) {
        console.error("No se pudo actualizar el resumen diario:", error);
      }

      setCantidadVenta((prev) => ({ ...prev, [producto.id]: 0 }));
    },
    [role]
  );

  const eliminarProducto = useCallback(
    async (id: string) => {
      if (role === "viewer") return;
      await deleteDoc(doc(db, "stock", id));
      setProductoEditando(null);
    },
    [role]
  );

  const eliminarEquipo = useCallback(
    async (id: string) => {
      if (role === "viewer") return;
      await deleteDoc(doc(db, "equipos_stock", id));
      setEquipoEditando(null);
      setEquipoImagesEdit([]);
      setEquipoPreviewsEdit([]);
      setEquipoGalleryEdit([]);
    },
    [role]
  );

  const handleCantidadChange = useCallback((id: string, value: number) => {
    setCantidadVenta((prev) => ({ ...prev, [id]: value }));
  }, []);

  const toggleSeleccionProducto = useCallback((id: string, checked: boolean) => {
    setProductosSeleccionados((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((selectedId) => selectedId !== id);
    });
  }, []);

  const toggleSeleccionTodos = useCallback(() => {
    setProductosSeleccionados((prev) => {
      if (productos.length === 0) return [];
      if (prev.length === productos.length) return [];
      return productos.map((p) => p.id);
    });
  }, [productos]);

  const aplicarAjustePrecioCliente = useCallback(
    (tipo: "incremento" | "decremento") => {
      if (role === "viewer") return;
      if (productosSeleccionados.length === 0) {
        setUiMessage({ type: "error", text: "Selecciona al menos un producto para ajustar precios." });
        return;
      }

      const porcentaje = Number(porcentajeAjuste.replace(",", "."));
      if (Number.isNaN(porcentaje) || porcentaje <= 0) {
        setUiMessage({ type: "error", text: "Ingresa un porcentaje mayor a 0." });
        return;
      }

      const factor = tipo === "incremento" ? 1 + porcentaje / 100 : 1 - porcentaje / 100;
      if (factor < 0) {
        setUiMessage({
          type: "error",
          text: "El decremento no puede ser mayor al 100%."
        });
        return;
      }

      const productosSeleccionadosSet = new Set(productosSeleccionados);
      const productosAAjustar = productos.filter((p) => productosSeleccionadosSet.has(p.id));
      if (productosAAjustar.length === 0) {
        setUiMessage({ type: "error", text: "No se encontraron productos validos para ajustar." });
        return;
      }

      const cambios = productosAAjustar.map((producto) => {
        const precioAnterior = Number(producto.precio || 0);
        const precioNuevo = Math.max(0, Number((precioAnterior * factor).toFixed(2)));
        return { id: producto.id, precioAnterior, precioNuevo };
      });

      setConfirmacionAjustePrecio({
        accion: tipo,
        porcentaje,
        cambios
      });
    },
    [porcentajeAjuste, productos, productosSeleccionados, role]
  );

  const deshacerUltimoAjustePrecioCliente = useCallback(() => {
    if (role === "viewer") return;
    const ultimoAjuste = historialAjustesPrecios[historialAjustesPrecios.length - 1];
    if (!ultimoAjuste) {
      setUiMessage({ type: "error", text: "No hay ajustes recientes para deshacer." });
      return;
    }

    const idsVigentes = new Set(productos.map((p) => p.id));
    const cambiosVigentes = ultimoAjuste.cambios.filter((cambio) => idsVigentes.has(cambio.id));
    if (cambiosVigentes.length === 0) {
      setUiMessage({ type: "error", text: "Los productos del ultimo ajuste ya no estan disponibles." });
      return;
    }

    setConfirmacionAjustePrecio({
      accion: "deshacer",
      cambios: cambiosVigentes
    });
  }, [historialAjustesPrecios, productos, role]);

  const confirmarAjustePrecioCliente = useCallback(async () => {
    if (role === "viewer" || !confirmacionAjustePrecio) return;

    setAplicandoAjustePrecios(true);
    try {
      let batch = writeBatch(db);
      let ops = 0;
      const commitBatch = async () => {
        if (ops === 0) return;
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      };

      if (confirmacionAjustePrecio.accion === "deshacer") {
        for (const cambio of confirmacionAjustePrecio.cambios) {
          batch.update(doc(db, "stock", cambio.id), { precio: cambio.precioAnterior });
          ops += 1;
          if (ops >= 400) await commitBatch();
        }
        await commitBatch();
        setHistorialAjustesPrecios((prev) => prev.slice(0, -1));
        setUiMessage({
          type: "success",
          text: `Se revirtio el ultimo ajuste en ${confirmacionAjustePrecio.cambios.length} producto(s).`
        });
      } else {
        for (const cambio of confirmacionAjustePrecio.cambios) {
          batch.update(doc(db, "stock", cambio.id), { precio: cambio.precioNuevo });
          ops += 1;
          if (ops >= 400) await commitBatch();
        }
        await commitBatch();
        setHistorialAjustesPrecios((prev) => [
          ...prev,
          { timestamp: Date.now(), cambios: confirmacionAjustePrecio.cambios }
        ]);
        setUiMessage({
          type: "success",
          text: `Se actualizo el Precio cliente de ${confirmacionAjustePrecio.cambios.length} producto(s).`
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo completar el ajuste.";
      setUiMessage({ type: "error", text: msg });
    } finally {
      setAplicandoAjustePrecios(false);
      setConfirmacionAjustePrecio(null);
    }
  }, [confirmacionAjustePrecio, role]);

  const importarStockDesdeCsv = useCallback(async () => {
    if (role === "viewer" || !archivoCsv) return;

    setImportandoCsv(true);
    try {
      const csvText = await archivoCsv.text();
      const rows = parseCsvRows(csvText);
      if (rows.length < 2) throw new Error("El CSV no tiene filas de datos.");

      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const idxName = headers.indexOf("name");
      const idxCategory = headers.indexOf("category");
      const idxCost = headers.indexOf("cost");
      const idxPrice = headers.indexOf("price");
      const idxQuantity = headers.indexOf("quantity");
      const idxDeletedAt = headers.indexOf("deletedat");

      if ([idxName, idxCategory, idxCost, idxPrice, idxQuantity].some((idx) => idx < 0)) {
        throw new Error("Faltan columnas obligatorias: Name, Category, Cost, Price o Quantity.");
      }

      const productosPorNombreNormalizado = new Map(
        productos.map((p) => [normalizeCsvProductName(p.nombre), p])
      );

      const productosImportados = new Set<string>();

      let creados = 0;
      let actualizados = 0;
      let omitidos = 0;
      let marcadosSinStock = 0;
      let movimientosRegistrados = 0;

      let batch = writeBatch(db);
      let ops = 0;
      const commitBatch = async () => {
        if (ops === 0) return;
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      };

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        const deletedAt = idxDeletedAt >= 0 ? String(row[idxDeletedAt] || "").trim() : "";
        if (deletedAt) {
          omitidos += 1;
          continue;
        }

        const nombre = String(row[idxName] || "").trim();
        const nombreNormalizado = normalizeCsvProductName(nombre);

        if (!nombre || shouldIgnoreCsvProduct(nombre)) {
          omitidos += 1;
          continue;
        }

        const categoriaCsv = String(row[idxCategory] || "").trim();
        const categoria = normalizeImportedCategory(categoriaCsv);
        const precioCosto = Number(String(row[idxCost] || "").replace(",", "."));
        const precio = Number(String(row[idxPrice] || "").replace(",", "."));
        const stock = Number(String(row[idxQuantity] || "").replace(",", "."));

        if (Number.isNaN(precioCosto) || Number.isNaN(precio) || Number.isNaN(stock)) {
          omitidos += 1;
          continue;
        }

        productosImportados.add(nombreNormalizado);

        const existente = productosPorNombreNormalizado.get(nombreNormalizado);
        const payload = {
          nombre,
          categoria,
          precio,
          precioCosto,
          stock,
          imagen: existente?.imagen || ""
        };

        if (existente) {
          batch.update(doc(db, "stock", existente.id), payload);
          ops += 1;

          const diferenciaStock = stock - Number(existente.stock || 0);
          if (diferenciaStock !== 0) {
            batch.set(doc(collection(db, "movimientos")), {
              producto: nombre,
              tipo: diferenciaStock > 0 ? "entrada" : "salida",
              cantidad: Math.abs(diferenciaStock),
              anterior: Number(existente.stock || 0),
              nuevo: stock,
              usuario: auth.currentUser?.email || "importador_csv",
              origen: "importacion_csv",
              fecha: serverTimestamp()
            });
            ops += 1;
            movimientosRegistrados += 1;
          }

          actualizados += 1;
        } else {
          batch.set(doc(collection(db, "stock")), payload);
          ops += 1;

          if (stock > 0) {
            batch.set(doc(collection(db, "movimientos")), {
              producto: nombre,
              tipo: "entrada",
              cantidad: stock,
              anterior: 0,
              nuevo: stock,
              usuario: auth.currentUser?.email || "importador_csv",
              origen: "importacion_csv",
              fecha: serverTimestamp()
            });
            ops += 1;
            movimientosRegistrados += 1;
          }

          creados += 1;
        }
        if (ops >= 400) await commitBatch();
      }

      for (const producto of productos) {
        const key = normalizeCsvProductName(producto.nombre);
        if (key && !productosImportados.has(key) && !shouldIgnoreCsvProduct(producto.nombre)) {
          batch.update(doc(db, "stock", producto.id), { stock: 0 });
          ops += 1;
          marcadosSinStock += 1;
        }
      }

      await commitBatch();
      setArchivoCsv(null);
      setUiMessage({
        type: "success",
        text: `Importacion completada. Creados: ${creados}, actualizados: ${actualizados}, marcados sin stock: ${marcadosSinStock}, omitidos: ${omitidos}.`
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error inesperado importando CSV.";
      setUiMessage({ type: "error", text: msg });
    } finally {
      setImportandoCsv(false);
    }
  }, [archivoCsv, productos, role]);

  const sincronizarCompragamer = useCallback(async () => {
    if (role === "viewer") return;

    setSincronizandoCompragamer(true);
    try {
      const syncFn = httpsCallable(functions, "syncCompragamer");
      const result = await syncFn({});
      const data = result.data as { ok?: boolean; created?: number; updated?: number; deleted?: number; total?: number; verified?: boolean; verifiedCount?: number; message?: string };
      if (!data.ok || !data.verified) {
        throw new Error("La sincronización terminó sin confirmar todos los precios.");
      }
      setUiMessage({
        type: "success",
        text: data.message ?? `Compragamer sincronizado y verificado: ${data.verifiedCount ?? data.total ?? 0} precios confirmados. ${data.created ?? 0} creados, ${data.updated ?? 0} actualizados, ${data.deleted ?? 0} eliminados.`
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo sincronizar Compragamer.";
      setUiMessage({ type: "error", text: msg });
    } finally {
      setSincronizandoCompragamer(false);
    }
  }, [functions, role]);

  const descargarPlantillaCsv = useCallback(() => {
    const headers = ["Name", "Description", "Category", "Cost", "Price", "Quantity", "DeletedAt"];
    const ejemplo = [
      "Producto de ejemplo",
      "",
      CATEGORIA[0],
      "10000",
      "15000",
      "5",
      ""
    ];
    const csv = `${headers.join(",")}\n${ejemplo.join(",")}\n`;
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_stock.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setUiMessage({ type: "info", text: "Plantilla CSV descargada." });
  }, []);

  const marginData = useMemo(() => {
    return getMarginData(Number(form.precio), Number(form.precioCosto));
  }, [form.precio, form.precioCosto]);

  const editMarginData = useMemo(() => {
    return getMarginData(Number(formEdit.precio), Number(formEdit.precioCosto));
  }, [formEdit.precio, formEdit.precioCosto]);

  const metrics = useMemo(() => {
    return productos.reduce(
      (acc, p) => {
        const stock = Number(p.stock) || 0;
        const precioCosto = Number(p.precioCosto) || 0;

        if (!isAccessoryCategoryValue(p.categoria)) {
          return acc;
        }

        acc.stockTotal += stock;
        acc.valorInventario += stock * precioCosto;
        return acc;
      },
      { stockTotal: 0, valorInventario: 0 }
    );
  }, [productos]);

  const productosPorNombre = useMemo(() => {
    return new Map(productos.map((p) => [p.nombre, p]));
  }, [productos]);

  const financialData = useMemo(() => {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const acumuladoVentas = new Map<string, { cantidad: number; ganancia: number }>();
    const ventasUltimos30 = new Set<string>();
    let totalGananciaHistorica = 0;
    let totalCostoHistorico = 0;
    let gananciaUltimos30Dias = 0;

    for (const venta of ventasHistoricas) {
      const producto = productosPorNombre.get(venta.producto);
      const costoUnitario = producto?.precioCosto ?? 0;
      const costoTotal = costoUnitario * venta.cantidad;
      const ingreso = venta.total ?? (venta.precioUnitario ?? producto?.precio ?? 0) * venta.cantidad;
      const ganancia = ingreso - costoTotal;

      totalGananciaHistorica += ganancia;
      totalCostoHistorico += costoTotal;

      const registro = acumuladoVentas.get(venta.producto) || { cantidad: 0, ganancia: 0 };
      registro.cantidad += venta.cantidad || 0;
      registro.ganancia += ganancia;
      acumuladoVentas.set(venta.producto, registro);

      if (venta.fecha?.toDate && venta.fecha.toDate() >= hace30Dias) {
        gananciaUltimos30Dias += ganancia;
        ventasUltimos30.add(venta.producto);
      }
    }

    let productoMasRentable = "-";
    let productoMasVendido = "-";
    let maxGanancia = Number.NEGATIVE_INFINITY;
    let maxCantidad = Number.NEGATIVE_INFINITY;

    acumuladoVentas.forEach((valor, producto) => {
      if (valor.ganancia > maxGanancia) {
        maxGanancia = valor.ganancia;
        productoMasRentable = producto;
      }
      if (valor.cantidad > maxCantidad) {
        maxCantidad = valor.cantidad;
        productoMasVendido = producto;
      }
    });

    const margenPromedio = totalCostoHistorico > 0
      ? (totalGananciaHistorica / totalCostoHistorico) * 100
      : 0;

    return {
      totalGananciaHistorica,
      gananciaUltimos30Dias,
      margenPromedio,
      productoMasRentable,
      productoMasVendido,
      totalCostoHistorico,
      ventasUltimos30
    };
  }, [productosPorNombre, ventasHistoricas]);

  const resumen30Dias = useMemo(() => {
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);

    return movimientos.reduce(
      (acc, m) => {
        if (m.tipo !== "venta" || !m.fecha?.toDate || m.fecha.toDate() < desde) return acc;
        const producto = productosPorNombre.get(m.producto);
        if (!producto) return acc;

        const costoTotal = producto.precioCosto * m.cantidad;
        const ganancia = (m.total || 0) - costoTotal;
        acc.costo += costoTotal;
        acc.ganancia += ganancia;
        return acc;
      },
      { costo: 0, ganancia: 0 }
    );
  }, [movimientos, productosPorNombre]);

  const dataPie = useMemo(
    () => [
      { name: "Ganancia", value: Math.max(0, financialData.totalGananciaHistorica) },
      { name: "Costo", value: Math.max(0, financialData.totalCostoHistorico) }
    ],
    [financialData.totalCostoHistorico, financialData.totalGananciaHistorica]
  );

  const alertasProductos = useMemo(() => {
    return productos.map((p) => {
      const margen = p.precioCosto > 0 ? ((p.precio - p.precioCosto) / p.precioCosto) * 100 : 0;
      return {
        ...p,
        margen,
        sinStock: p.stock === 0,
        stockBajo: p.stock > 0 && p.stock <= 5,
        sinVentas30Dias: !financialData.ventasUltimos30.has(p.nombre),
        margenBajo: margen < 10
      };
    });
  }, [financialData.ventasUltimos30, productos]);

  const productosConAlertas = useMemo(
    () => alertasProductos.filter((p) => p.sinStock || p.stockBajo || p.sinVentas30Dias || p.margenBajo),
    [alertasProductos]
  );

  const alertasPorProductoId = useMemo(
    () =>
      new Map(
        alertasProductos.map((p) => [
          p.id,
          {
            sinStock: p.sinStock,
            stockBajo: p.stockBajo,
            sinVentas30Dias: p.sinVentas30Dias,
            margenBajo: p.margenBajo
          }
        ])
      ),
    [alertasProductos]
  );

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
      }),
    []
  );

  const productosVisibles = useMemo(
    () => productos.slice(0, visibleProductos),
    [productos, visibleProductos]
  );
  const productosSeleccionadosSet = useMemo(() => new Set(productosSeleccionados), [productosSeleccionados]);
  const todosLosProductosSeleccionados = productos.length > 0 && productosSeleccionados.length === productos.length;

  const movimientosVisibles = useMemo(
    () => movimientos.slice(0, mostrarTodosMovimientos ? visibleMovimientos : 1),
    [movimientos, mostrarTodosMovimientos, visibleMovimientos]
  );

  const equiposVisibles = useMemo(
    () => equiposStock
      .filter((equipo) => {
        const matchesType = stockType === "reacondicionados"
          ? equipo.condition === "Reacondicionado"
          : equipo.condition !== "Reacondicionado";
        return matchesType && getDefaultStockCategory(equipo) === stockCategory;
      })
      .slice(0, visibleEquipos),
    [equiposStock, stockCategory, stockType, visibleEquipos]
  );

  const equiposFiltrados = useMemo(
    () => equiposStock.filter((equipo) => {
      const matchesType = stockType === "reacondicionados"
        ? equipo.condition === "Reacondicionado"
        : equipo.condition !== "Reacondicionado";
      return matchesType && getDefaultStockCategory(equipo) === stockCategory;
    }),
    [equiposStock, stockCategory, stockType]
  );

  if (!isAuth) return <AdminLogin onLogin={() => setIsAuth(true)} />;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 px-3 py-6 text-slate-100 sm:px-6 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 sm:space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-white/10 p-2 shadow-lg">
              <img src="/logo.png" alt="ServiTec" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-2xl font-black leading-none tracking-tight">
                <span className="text-white">Servi</span><span className="text-red-500">Tec</span>
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Panel administrativo</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Ir al inicio
            </button>
            <button
              onClick={() => signOut(auth)}
              className="rounded-xl border border-rose-300/30 bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Cerrar sesion
            </button>
          </div>
        </div>

        <nav className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-2 shadow-xl sm:grid-cols-2">
          {([
            { id: "dashboard", label: "Dashboard", description: "Inventario y resumen", icon: LayoutDashboard },
            { id: "stock", label: "Stock", description: "Nuevos y reacondicionados", icon: Boxes }
          ] as const).map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSegment(id)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${activeSegment === id ? "bg-white text-slate-950 shadow-lg" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>
                <span className="block text-sm font-bold uppercase tracking-wide">{label}</span>
                <span className={`block text-xs ${activeSegment === id ? "text-slate-500" : "text-slate-400"}`}>{description}</span>
              </span>
            </button>
          ))}
        </nav>

        {uiMessage && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
              uiMessage.type === "success"
                ? "border-emerald-200/30 bg-emerald-500/20 text-emerald-100"
                : uiMessage.type === "error"
                  ? "border-red-200/30 bg-red-500/20 text-red-100"
                  : "border-slate-200/30 bg-slate-500/20 text-slate-100"
            }`}
          >
            {uiMessage.text}
          </div>
        )}

        {dataError && (
          <div className="rounded-2xl border border-amber-200/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-100 shadow-lg">
            {dataError}
          </div>
        )}

        {sincronizandoCompragamer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-sky-300/30 bg-slate-900 p-8 text-center text-white shadow-2xl">
              <LoaderCircle className="mx-auto mb-5 h-12 w-12 animate-spin text-sky-300" />
              <h2 className="text-xl font-semibold">Sincronizando precios</h2>
              <p className="mt-3 text-sm text-slate-300">Estamos consultando Compragamer y verificando cada actualización en el inventario. No cierres esta ventana.</p>
            </div>
          </div>
        )}

        {activeSegment === "dashboard" && <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        >
          <Card title="Stock total" value={metrics.stockTotal} />
          <Card title="Valor inventario" value={currency.format(metrics.valorInventario)} />
          <Card title="Rol actual" value={role} />
        </motion.div>}

        {activeSegment === "dashboard" && <div className="grid items-start gap-6 xl:grid-cols-12">

          <div className="space-y-6 xl:col-span-12">
            {role !== "viewer" && (
              <>
                <motion.section
                  className="rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl"
                  initial="hidden"
                  animate="show"
                  variants={blockAnimation}
                >
                  <h2 className="mb-4 text-xl font-semibold">Agregar nuevo producto</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        placeholder="Nombre del producto"
                        value={form.nombre}
                        onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        className="w-full rounded-lg border p-3"
                        required
                      />
                      <select
                        value={form.categoria}
                        onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                        required
                        className="w-full rounded-lg border p-3"
                      >
                        <option value="">Seleccionar categoria</option>
                        {CATEGORIA.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Costo de proveedor"
                        value={form.precioCosto}
                        onChange={(e) => setForm((prev) => ({ ...prev, precioCosto: e.target.value }))}
                        className="w-full rounded-lg border p-3"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Precio Cliente"
                        value={form.precio}
                        onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
                        className="w-full rounded-lg border p-3"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Stock a anadir"
                        value={form.stock}
                        onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                        className="w-full rounded-lg border p-3 md:col-span-2"
                        required
                      />
                    </div>

                    <input type="file" accept="image/*" onChange={handleImageChange} />
                    {preview && (
                      <img
                        src={preview}
                        className="h-24 rounded-lg object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    <button type="submit" className="rounded-lg bg-black px-5 py-2 text-white">
                      Guardar producto
                    </button>
                    <p className="text-sm text-green-600">
                      Ganancia estimada: ${marginData.margen} ({marginData.porcentaje}%)
                    </p>
                  </form>
                </motion.section>

              </>
            )}
          </div>
        </div>}

        {activeSegment === "dashboard" && <div className="grid gap-6 xl:grid-cols-12">
        <motion.section
          className="rounded-3xl border border-white/10 bg-white p-5 text-slate-900 shadow-2xl sm:p-8 xl:col-span-7"
          initial="hidden"
          animate="show"
          variants={blockAnimation}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Gestion de inventario</h2>
              <p className="text-xs text-slate-500">Accesorios cargados manualmente o mediante CSV</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {productos.length} producto(s)
            </span>
          </div>
          {role !== "viewer" && (
            <div className="mb-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-700">
                  Seleccionados: <b>{productosSeleccionados.length}</b> de {productos.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSeleccionTodos}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {todosLosProductosSeleccionados ? "Deseleccionar todo" : "Seleccionar todo"}
                  </button>
                  <button
                    onClick={() => setProductosSeleccionados([])}
                    disabled={productosSeleccionados.length === 0}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Limpiar seleccion
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={porcentajeAjuste}
                  onChange={(e) => setPorcentajeAjuste(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-[220px]"
                  placeholder="Porcentaje"
                />
                <button
                  onClick={() => aplicarAjustePrecioCliente("incremento")}
                  disabled={aplicandoAjustePrecios || productosSeleccionados.length === 0}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aplicandoAjustePrecios ? "Aplicando..." : "Incrementar %"}
                </button>
                <button
                  onClick={() => aplicarAjustePrecioCliente("decremento")}
                  disabled={aplicandoAjustePrecios || productosSeleccionados.length === 0}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aplicandoAjustePrecios ? "Aplicando..." : "Decrementar %"}
                </button>
                <button
                  onClick={deshacerUltimoAjustePrecioCliente}
                  disabled={aplicandoAjustePrecios || historialAjustesPrecios.length === 0}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Deshacer ultimo ajuste
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                El ajuste se aplica sobre el campo Precio cliente de los productos seleccionados.
              </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Carga masiva de stock</h3>
                    <p className="text-xs text-slate-500">Actualiza los accesorios mediante un archivo CSV.</p>
                  </div>
                  <button
                    type="button"
                    onClick={descargarPlantillaCsv}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Descargar plantilla
                  </button>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setArchivoCsv(e.target.files?.[0] || null)}
                    className="min-w-0 flex-1 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={importarStockDesdeCsv}
                      disabled={!archivoCsv || importandoCsv}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {importandoCsv ? "Importando..." : "Importar CSV"}
                    </button>
                    <button
                      onClick={sincronizarCompragamer}
                      disabled={sincronizandoCompragamer}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sincronizandoCompragamer ? "Sincronizando..." : "Sincronizar Compragamer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {productos.length === 0 && <p className="text-gray-500">No hay productos cargados.</p>}

          <motion.div
            className="max-h-[min(68vh,720px)] space-y-3 overflow-y-auto pr-1 sm:space-y-4 sm:pr-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {productosVisibles.map((p) => (
              <ProductoRow
                key={p.id}
                producto={p}
                role={role}
                cantidad={cantidadVenta[p.id] || 0}
                alertas={alertasPorProductoId.get(p.id)}
                onCantidadChange={handleCantidadChange}
                onRegistrarVenta={registrarVenta}
                onAbrirEditor={abrirEditor}
                seleccionado={productosSeleccionadosSet.has(p.id)}
                onToggleSeleccion={toggleSeleccionProducto}
              />
            ))}
          </motion.div>
          {visibleProductos < productos.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisibleProductos((prev) => prev + INVENTARIO_PAGE_SIZE)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
              >
                Cargar mas productos
              </button>
            </div>
          )}
        </motion.section>

        <motion.section
          className="rounded-3xl border border-white/10 bg-white p-5 text-slate-900 shadow-2xl sm:p-8 xl:col-span-5"
          initial="hidden"
          animate="show"
          variants={blockAnimation}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">Historial de movimientos</h2>
              <p className="text-xs text-slate-500">
                {movimientos.length === 0 ? "Sin movimientos recientes" : `Último movimiento de ${movimientos.length} registrado(s)`}
              </p>
            </div>
            {movimientos.length > 1 && (
              <button
                type="button"
                onClick={() => setMostrarTodosMovimientos((prev) => !prev)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {mostrarTodosMovimientos ? "Mostrar solo el último" : "Ver historial completo"}
              </button>
            )}
          </div>
          {movimientos.length === 0 && <p className="text-gray-500">No hay movimientos registrados.</p>}

          <div className={`${mostrarTodosMovimientos ? "max-h-[500px] overflow-y-auto pr-2" : ""} space-y-4`}>
            {movimientosVisibles.map((m, i) => (
              <div
                key={`${m.producto}-${m.tipo}-${i}`}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className={getMovimientoMeta(m.tipo).color}>{getMovimientoMeta(m.tipo).label}</span> -{' '}
                    <span className="break-words">{m.producto}</span>
                  </p>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    {m.usuario}
                    {m.origen === "importacion_csv" ? " • Importacion CSV" : ""}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold sm:text-base">{m.cantidad} unidades</p>
                  {m.total && <p className="text-xs text-emerald-600 sm:text-sm">Total: ${m.total}</p>}
                </div>
              </div>
            ))}
          </div>
          {mostrarTodosMovimientos && visibleMovimientos < movimientos.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisibleMovimientos((prev) => prev + HISTORIAL_PAGE_SIZE)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
              >
                Cargar mas movimientos
              </button>
            </div>
          )}
        </motion.section>
        </div>}

        {activeSegment === "stock" && <motion.section
          className="rounded-3xl border border-white/10 bg-white p-4 text-slate-900 shadow-2xl sm:p-8"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={blockAnimation}
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Gestión especializada</p>
              <h2 className="text-lg font-semibold sm:text-xl">Stock de {stockType === "nuevos" ? "nuevos" : "reacondicionados"}</h2>
            </div>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => { setStockType("nuevos"); setEquipoForm((prev) => ({ ...prev, condition: "Sellado" })); setVisibleEquipos(INVENTARIO_PAGE_SIZE); }}
                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${stockType === "nuevos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                Nuevos
              </button>
              <button
                onClick={() => { setStockType("reacondicionados"); setEquipoForm((prev) => ({ ...prev, condition: "Reacondicionado" })); setVisibleEquipos(INVENTARIO_PAGE_SIZE); }}
                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${stockType === "reacondicionados" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                Reacondicionados
              </button>
            </div>
          </div>

          {role !== "viewer" && (
            <form
              onSubmit={crearEquipo}
              className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-3">
                  Categoría del equipo
                  <select
                    value={stockCategory}
                    onChange={(e) => {
                      const categoria = e.target.value as StockCategory;
                      setStockCategory(categoria);
                      setEquipoForm((prev) => ({ ...prev, categoria }));
                    }}
                    className="mt-1 w-full rounded-lg border p-2.5 font-normal sm:p-3"
                  >
                    {STOCK_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                  </select>
                </label>
                <input
                  placeholder="Nombre / descripción"
                  value={equipoForm.nombre}
                  onChange={(e) => setEquipoForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="rounded-lg border p-2.5 text-sm sm:p-3 sm:col-span-2 xl:col-span-3"
                  required
                />
                {stockCategory === "pc-armada" && (
                  <>
                    <input
                      placeholder="Descripción"
                      value={equipoForm.detail}
                      onChange={(e) => setEquipoForm((prev) => ({ ...prev, detail: e.target.value }))}
                      className="rounded-lg border p-2.5 text-sm sm:p-3 sm:col-span-2"
                      required
                    />
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input type="checkbox" checked={equipoForm.recomendada} onChange={(e) => setEquipoForm((prev) => ({ ...prev, recomendada: e.target.checked }))} />
                      Configuración recomendada
                    </label>
                    <div className="sm:col-span-2 xl:col-span-3">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {PC_COMPONENT_GROUPS.map((key) => {
                          const selectedComponent = equipoForm.componentes.find((component) => component.key === key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setComponentPickerMode("create");
                                setComponentPickerTab(key);
                                setComponentPickerSearch("");
                              }}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${componentPickerTab === key && componentPickerMode === "create" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
                            >
                              {componentCatalogLabels[key]}{selectedComponent ? ` • ${selectedComponent.nombre}` : ""}
                            </button>
                          );
                        })}
                      </div>

                      {componentPickerMode === "create" && componentPickerTab && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="mb-3">
                            <input
                              value={componentPickerSearch}
                              onChange={(e) => setComponentPickerSearch(e.target.value)}
                              placeholder="Buscar componente..."
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>

                          <div className="grid max-h-80 gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
                            {(componentCatalog[componentPickerTab] || [])
                              .filter((product) => product.nombre.toLowerCase().includes(componentPickerSearch.toLowerCase()))
                              .map((product) => (
                                <button
                                  key={product.nombre}
                                  type="button"
                                  onClick={() => selectComponentFromPicker("create", componentPickerTab, product)}
                                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-slate-400 hover:bg-white"
                                >
                                  {product.imagenes?.[0] ? (
                                    <img
                                      src={catalogProductImage(product, componentCatalogSources[componentPickerTab])}
                                      alt={product.nombre}
                                      className="h-14 w-14 rounded-lg object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-semibold text-slate-600">IMG</div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-xs font-semibold text-slate-800">{product.nombre}</p>
                                    <p className="mt-1 text-xs font-medium text-emerald-600">${Number(product.precio || 0).toLocaleString("es-AR")}</p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {STOCK_FIELDS[stockCategory].map(({ key, label }) => (
                  <input
                    key={key}
                    placeholder={label}
                    value={equipoForm[key]}
                    onChange={(e) => setEquipoForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="rounded-lg border p-2.5 text-sm sm:p-3"
                    required
                  />
                ))}
                {stockCategory === "notebook" && (
                  <div className="grid grid-cols-1 gap-3 sm:col-span-2 xl:col-span-3 sm:grid-cols-2 xl:grid-cols-3">
                    {NOTEBOOK_EXTRA_FIELDS.map(({ key, label }) => (
                      <input
                        key={key}
                        placeholder={label}
                        value={equipoForm[key]}
                        onChange={(e) => setEquipoForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="rounded-lg border p-2.5 text-sm sm:p-3"
                      />
                    ))}
                  </div>
                )}
                <input
                  type="number"
                  placeholder="Precio original"
                  value={equipoForm.original}
                  onChange={(e) => setEquipoForm((prev) => ({ ...prev, original: e.target.value }))}
                  className="rounded-lg border p-2.5 text-sm sm:p-3"
                  required
                />
                <input
                  type="number"
                  placeholder="Precio promo"
                  value={equipoForm.promo}
                  onChange={(e) => setEquipoForm((prev) => ({ ...prev, promo: e.target.value }))}
                  className="rounded-lg border p-2.5 text-sm sm:p-3"
                  required
                />
                <textarea
                  placeholder="Notas Libres"
                  value={equipoForm.notas}
                  onChange={(e) => setEquipoForm((prev) => ({ ...prev, notas: e.target.value }))}
                  className="min-h-[90px] rounded-lg border p-2.5 text-sm sm:col-span-2 xl:col-span-3 sm:p-3"
                />
                <select
                  value={equipoForm.estado}
                  onChange={(e) => setEquipoForm((prev) => ({ ...prev, estado: e.target.value }))}
                  className="rounded-lg border p-2.5 text-sm sm:p-3"
                >
                  <option value="disponible">Disponible</option>
                  <option value="vendido">Vendido</option>
                </select>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEquipoImageChange}
                  className="rounded-lg border p-2.5 text-sm sm:p-3 sm:col-span-2 xl:col-span-1"
                />
              </div>
              {equipoPreviews.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {equipoPreviews.map((url, index) => (
                    <div key={url} className="flex flex-col items-center gap-1">
                      <img src={url} className="h-24 w-24 rounded-lg object-cover" loading="lazy" decoding="async" />
                      <span className="text-xs font-semibold">Foto {index + 1}</span>
                      <div className="flex gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moverImagen(index, -1)} className="rounded border px-2 disabled:opacity-30">←</button>
                        <button type="button" disabled={index === equipoPreviews.length - 1} onClick={() => moverImagen(index, 1)} className="rounded border px-2 disabled:opacity-30">→</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="submit"
                disabled={guardandoEquipo}
                className="w-full rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white sm:w-auto sm:text-base"
              >
                {guardandoEquipo ? <><LoaderCircle className="mr-2 inline-block animate-spin" size={16} /> Guardando...</> : "Guardar equipo"}
              </button>
            </form>
          )}

          {equiposFiltrados.length === 0 && <p className="text-gray-500">No hay equipos cargados en esta categoría.</p>}

          <div className="space-y-4">
            {equiposVisibles.map((equipo) => {
              const vendido = String(equipo.estado || "disponible").toLowerCase() === "vendido";
              return (
                <div
                  key={equipo.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {equipo.imagen && (
                      <img
                        src={equipo.imagen}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-semibold sm:text-base">{equipo.nombre}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${vendido ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {vendido ? "Vendido" : "Disponible"}
                        </span>
                      </div>
                      <p className="break-words text-xs text-slate-600 sm:text-sm">
                        {equipo.marca} {equipo.modelo} • {equipo.almacenamiento} • {equipo.ram}
                      </p>
                      <p className="break-words text-xs text-slate-600 sm:text-sm">
                        {equipo.condition} • Garantia: {equipo.warranty}
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 sm:text-sm">
                        Promo: {currency.format(Number(equipo.promo || 0))} | Original: {currency.format(Number(equipo.original || 0))}
                      </p>
                    </div>
                  </div>

                  {role !== "viewer" && (
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                      <button
                        onClick={() => abrirEditorEquipo(equipo)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-slate-100 sm:flex-none"
                      >
                        Editar
                      </button>
                      {!vendido && (
                        <button
                          onClick={() => marcarEquipoVendido(equipo)}
                          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 sm:flex-none"
                        >
                          Marcar vendido
                        </button>
                      )}
                      <button
                        onClick={() => eliminarEquipo(equipo.id)}
                        className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600 sm:flex-none"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {visibleEquipos < equiposFiltrados.length && (
            <div className="mt-6 flex justify-center">
              <button
              onClick={() => setVisibleEquipos((prev) => prev + INVENTARIO_PAGE_SIZE)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
            >
              Cargar mas equipos
            </button>
            </div>
          )}
        </motion.section>}

        <AnimatePresence>
          {confirmacionAjustePrecio && (
            <motion.div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0 }}
              >
                <h3 className="text-lg font-semibold">Confirmar accion</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {confirmacionAjustePrecio.accion === "deshacer"
                    ? `Se va a restaurar el Precio cliente anterior en ${confirmacionAjustePrecio.cambios.length} producto(s).`
                    : `Se va a ${confirmacionAjustePrecio.accion} ${confirmacionAjustePrecio.porcentaje}% el Precio cliente en ${confirmacionAjustePrecio.cambios.length} producto(s).`}
                </p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setConfirmacionAjustePrecio(null)}
                    disabled={aplicandoAjustePrecios}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarAjustePrecioCliente}
                    disabled={aplicandoAjustePrecios}
                    className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      confirmacionAjustePrecio.accion === "deshacer"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {aplicandoAjustePrecios ? "Aplicando..." : "Confirmar"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {equipoEditando && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:p-8"
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0 }}
              >
                <button
                  onClick={() => {
                    setEquipoEditando(null);
                    setEquipoImagesEdit([]);
                    setEquipoPreviewsEdit([]);
                    setEquipoGalleryEdit([]);
                  }}
                  className="absolute right-3 top-3 rounded-md p-2 transition hover:bg-slate-100 sm:right-4 sm:top-4"
                >
                  X
                </button>

                <h2 className="mb-6 text-lg font-semibold sm:text-xl">Editar equipo</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                    Categoría
                    <select
                      value={equipoFormEdit.categoria}
                      onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, categoria: e.target.value as StockCategory }))}
                      className="mt-1 w-full rounded-lg border p-2.5 font-normal sm:p-3"
                    >
                      {STOCK_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>{category.label}</option>
                      ))}
                    </select>
                  </label>
                  <input
                    value={equipoFormEdit.nombre}
                    onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, nombre: e.target.value }))}
                    className="rounded-lg border p-2.5 text-sm sm:p-3 sm:col-span-2"
                    placeholder="Nombre / descripción"
                  />
                  {equipoFormEdit.categoria === "pc-armada" && (
                    <>
                      <input
                        value={equipoFormEdit.detail}
                        onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, detail: e.target.value }))}
                        className="rounded-lg border p-2.5 text-sm sm:p-3"
                        placeholder="Descripción"
                      />
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={equipoFormEdit.recomendada} onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, recomendada: e.target.checked }))} />
                        Configuración recomendada
                      </label>
                      <div className="sm:col-span-2">
                        <div className="mb-3 flex flex-wrap gap-2">
                          {PC_COMPONENT_GROUPS.map((key) => {
                            const selectedComponent = equipoFormEdit.componentes.find((component) => component.key === key);
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  setComponentPickerMode("edit");
                                  setComponentPickerTab(key);
                                  setComponentPickerSearch("");
                                }}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${componentPickerTab === key && componentPickerMode === "edit" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
                              >
                                {componentCatalogLabels[key]}{selectedComponent ? ` • ${selectedComponent.nombre}` : ""}
                              </button>
                            );
                          })}
                        </div>

                        {componentPickerMode === "edit" && componentPickerTab && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="mb-3">
                              <input
                                value={componentPickerSearch}
                                onChange={(e) => setComponentPickerSearch(e.target.value)}
                                placeholder="Buscar componente..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              />
                            </div>

                            <div className="grid max-h-80 gap-3 overflow-y-auto sm:grid-cols-2">
                              {(componentCatalog[componentPickerTab] || [])
                                .filter((product) => product.nombre.toLowerCase().includes(componentPickerSearch.toLowerCase()))
                                .map((product) => (
                                  <button
                                    key={product.nombre}
                                    type="button"
                                    onClick={() => selectComponentFromPicker("edit", componentPickerTab, product)}
                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-slate-400 hover:bg-white"
                                  >
                                    {product.imagenes?.[0] ? (
                                      <img
                                        src={catalogProductImage(product, componentCatalogSources[componentPickerTab])}
                                        alt={product.nombre}
                                        className="h-14 w-14 rounded-lg object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-semibold text-slate-600">IMG</div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="line-clamp-2 text-xs font-semibold text-slate-800">{product.nombre}</p>
                                      <p className="mt-1 text-xs font-medium text-emerald-600">${Number(product.precio || 0).toLocaleString("es-AR")}</p>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {STOCK_FIELDS[equipoFormEdit.categoria].map(({ key, label }) => (
                    <input
                      key={key}
                      value={equipoFormEdit[key]}
                      onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="rounded-lg border p-2.5 text-sm sm:p-3"
                      placeholder={label}
                    />
                  ))}
                  {equipoFormEdit.categoria === "notebook" && (
                    <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
                      {NOTEBOOK_EXTRA_FIELDS.map(({ key, label }) => (
                        <input
                          key={key}
                          value={equipoFormEdit[key]}
                          onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="rounded-lg border p-2.5 text-sm sm:p-3"
                          placeholder={label}
                        />
                      ))}
                    </div>
                  )}
                  <input
                    type="number"
                    value={equipoFormEdit.original}
                    onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, original: e.target.value }))}
                    className="rounded-lg border p-2.5 text-sm sm:p-3"
                    placeholder="Precio original"
                  />
                  <input
                    type="number"
                    value={equipoFormEdit.promo}
                    onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, promo: e.target.value }))}
                    className="rounded-lg border p-2.5 text-sm sm:p-3"
                    placeholder="Precio promo"
                  />
                  <textarea
                    value={equipoFormEdit.notas}
                    onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, notas: e.target.value }))}
                    className="min-h-[100px] rounded-lg border p-2.5 text-sm sm:col-span-2 sm:p-3"
                    placeholder="Notas (texto o números libres)"
                  />
                  <select
                    value={equipoFormEdit.estado}
                    onChange={(e) => setEquipoFormEdit((prev) => ({ ...prev, estado: e.target.value }))}
                    className="rounded-lg border p-2.5 text-sm sm:p-3"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="vendido">Vendido</option>
                  </select>
                </div>

                <div className="mt-4 space-y-3">
                  <input type="file" accept="image/*" multiple onChange={handleEquipoImageEditChange} />
                  {(equipoPreviewsEdit.length > 0 || equipoGalleryEdit.length > 0) && (
                    <div className="flex flex-wrap gap-3">
                      {(equipoPreviewsEdit.length > 0 ? equipoPreviewsEdit : equipoGalleryEdit).map((url, index, images) => (
                        <div key={url} className="flex flex-col items-center gap-1">
                          <img src={url} className="h-24 w-24 rounded-lg object-cover" loading="lazy" decoding="async" />
                          <span className="text-xs font-semibold">Foto {index + 1}</span>
                          <div className="flex gap-1">
                            <button type="button" disabled={index === 0} onClick={() => moverImagen(index, -1, true)} className="rounded border px-2 disabled:opacity-30">←</button>
                            <button type="button" disabled={index === images.length - 1} onClick={() => moverImagen(index, 1, true)} className="rounded border px-2 disabled:opacity-30">→</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => eliminarEquipo(equipoEditando.id)}
                    className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white sm:w-auto"
                  >
                    Eliminar equipo
                  </button>
                  <button
                    onClick={guardarEquipoEdicion}
                    className="w-full rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white sm:w-auto"
                  >
                    Guardar cambios
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {productoEditando && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0 }}
              >
                <button onClick={() => setProductoEditando(null)} className="absolute right-4 top-4">
                  X
                </button>

                <h2 className="mb-6 text-xl font-semibold">Editar producto</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <input
                    value={formEdit.nombre}
                    onChange={(e) => setFormEdit((prev) => ({ ...prev, nombre: e.target.value }))}
                    className="rounded-lg border p-3"
                    placeholder="Nombre"
                  />
                  <select
                    value={formEdit.categoria}
                    onChange={(e) => setFormEdit((prev) => ({ ...prev, categoria: e.target.value }))}
                    className="rounded-lg border p-3"
                  >
                    {CATEGORIA.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={formEdit.precioCosto}
                    onChange={(e) => setFormEdit((prev) => ({ ...prev, precioCosto: e.target.value }))}
                    className="rounded-lg border p-3"
                    placeholder="Precio costo"
                  />
                  <input
                    type="number"
                    value={formEdit.precio}
                    onChange={(e) => setFormEdit((prev) => ({ ...prev, precio: e.target.value }))}
                    className="rounded-lg border p-3"
                    placeholder="Precio venta"
                  />
                  <input
                    type="number"
                    value={formEdit.stock}
                    onChange={(e) => setFormEdit((prev) => ({ ...prev, stock: e.target.value }))}
                    className="rounded-lg border p-3"
                    placeholder="Stock"
                  />
                </div>

                <div className="mt-6 space-y-3">
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  {(preview || productoEditando.imagen) && (
                    <img
                      src={preview || productoEditando.imagen}
                      className="h-28 rounded-lg object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <p className="mt-4 text-sm text-emerald-700">
                  Ganancia estimada: ${editMarginData.margen} ({editMarginData.porcentaje}%)
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {role !== "viewer" && (
                    <button
                      onClick={() => eliminarProducto(productoEditando.id)}
                      className="rounded-lg bg-red-500 px-4 py-2 text-white"
                    >
                      Eliminar producto
                    </button>
                  )}
                  <button onClick={guardarEdicion} className="rounded-lg bg-black px-6 py-2 text-white">
                    Guardar cambios
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ProductoRow = memo(
  ({
    producto,
    role,
    cantidad,
    alertas,
    onCantidadChange,
    onRegistrarVenta,
    onAbrirEditor,
    seleccionado,
    onToggleSeleccion
  }: {
    producto: Producto;
    role: Role | null;
    cantidad: number;
    alertas?: {
      sinStock: boolean;
      stockBajo: boolean;
      sinVentas30Dias: boolean;
      margenBajo: boolean;
    };
    onCantidadChange: (id: string, value: number) => void;
    onRegistrarVenta: (producto: Producto, cantidad: number) => Promise<void>;
    onAbrirEditor: (producto: Producto) => void;
    seleccionado: boolean;
    onToggleSeleccion: (id: string, checked: boolean) => void;
  }) => {
    const marginInfo = getMarginData(Number(producto.precio), Number(producto.precioCosto));

    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm sm:gap-4 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {role !== "viewer" && (
          <input
            type="checkbox"
            checked={seleccionado}
            onChange={(e) => onToggleSeleccion(producto.id, e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            aria-label={`Seleccionar ${producto.nombre}`}
          />
        )}
        {producto.imagen && (
          <img
            src={producto.imagen}
            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
            loading="lazy"
            decoding="async"
          />
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-semibold sm:text-lg">{producto.nombre}</h3>
            {alertas?.sinStock && (
              <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                Sin stock
              </span>
            )}
            {alertas?.stockBajo && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                Stock bajo
              </span>
            )}
            {alertas?.sinVentas30Dias && (
              <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">
                Sin ventas 30d
              </span>
            )}
            {alertas?.margenBajo && (
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                Margen &lt; 10%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Categoria: {producto.categoria}</p>
          <p className="text-sm">
            Stock: <b>{producto.stock}</b>
          </p>
          <p className="text-sm">
            Precio: <b>${producto.precio}</b>
          </p>
          <p className="text-sm text-emerald-700">
            Ganancia estimada: ${marginInfo.margen} ({marginInfo.porcentaje}%)
          </p>
        </div>
      </div>

      {role !== "viewer" && (
        <div className="flex w-full flex-col gap-2 lg:w-[300px] lg:shrink-0">
          <button
            onClick={() => onAbrirEditor(producto)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
          >
            Editar producto
          </button>

          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={cantidad || ""}
              onChange={(e) => onCantidadChange(producto.id, Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 p-2"
              placeholder="Cantidad vendida"
            />
            <button
              onClick={() => onRegistrarVenta(producto, cantidad)}
              className="rounded-xl bg-emerald-600 px-4 font-medium text-white transition hover:bg-emerald-700"
            >
              Vender
            </button>
          </div>
        </div>
      )}
      </div>
    );
  }
);

const Card = memo(({ title, value }: { title: string; value: ReactNode }) => (
  <motion.div
    variants={blockAnimation}
    className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-lg sm:p-6"
  >
    <p className="text-xs uppercase tracking-wide text-slate-300 sm:text-sm">{title}</p>
    <h2 className="mt-2 break-words text-lg font-semibold text-white sm:text-2xl">{value}</h2>
  </motion.div>
));

export default Admin;
