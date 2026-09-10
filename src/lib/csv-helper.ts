import type { Product, Color } from "./products";

/**
 * Escapes a field for RFC 4180 CSV compliance.
 */
function escapeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialize colors array to a clean string format:
 * "Cosmic Orange:#a8563c:https://img-url; Deep Blue:#0b1736:https://img-url"
 */
function serializeColors(colors?: Color[]): string {
  if (!colors || colors.length === 0) return "";
  return colors
    .map((c) => {
      const name = (c.name || "Color").trim();
      const hex = (c.hex || "#000000").trim();
      if (c.image && c.image.trim()) {
        return `${name}:${hex}:${c.image.trim()}`;
      }
      return `${name}:${hex}`;
    })
    .join("; ");
}

/**
 * Parse colors string from CSV back into Color[] array.
 * Robust parser supporting:
 * - "Name:#hex:https://image-url; Name:#hex:https://image-url"
 * - "Name:#hex; Name:#hex"
 * - "Name | #hex | https://image-url; Name | #hex | https://image-url"
 * - "Midnight, Starlight, Silver"
 * - JSON string "[{name, hex, image}]"
 */
export function parseColors(input?: string): Color[] {
  if (!input || !input.trim()) return [];
  const trimmed = input.trim();

  // Handle JSON array
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          name: String(item.name || "Color").trim(),
          hex: String(item.hex || "#000000").trim(),
          ...(item.image && String(item.image).trim() ? { image: String(item.image).trim() } : {}),
        }));
      }
    } catch {}
  }

  // Handle semicolon separated color entries
  const entries = trimmed.split(/[;]+/).map((e) => e.trim()).filter(Boolean);
  const colors: Color[] = [];

  for (const entry of entries) {
    // 1. Pipe-separated: Name | #hex | image_url
    if (entry.includes("|")) {
      const parts = entry.split("|").map((p) => p.trim());
      const name = parts[0] || "Color";
      const hex = parts[1] && (parts[1].startsWith("#") || /^[0-9A-Fa-f]{3,6}$/.test(parts[1]))
        ? parts[1].startsWith("#") ? parts[1] : `#${parts[1]}`
        : getColorHexFromName(name);
      const image = parts.slice(2).join("|").trim() || undefined;
      colors.push({
        name,
        hex,
        ...(image ? { image } : {}),
      });
    }
    // 2. Colon-separated: Name:#hex:https://image_url
    else if (entry.includes(":")) {
      const parts = entry.split(":").map((p) => p.trim());
      const name = parts[0] || "Color";
      const hex = parts[1] && (parts[1].startsWith("#") || /^[0-9A-Fa-f]{3,6}$/.test(parts[1]))
        ? parts[1].startsWith("#") ? parts[1] : `#${parts[1]}`
        : getColorHexFromName(name);
      
      // Crucial: parts.slice(2).join(":") preserves the entire URL even with "https://"
      let image: string | undefined = undefined;
      if (parts.length > 2) {
        const joinedUrl = parts.slice(2).join(":").trim();
        if (joinedUrl.length > 0) {
          image = joinedUrl;
        }
      }

      colors.push({
        name,
        hex,
        ...(image ? { image } : {}),
      });
    }
    // 3. Simple comma-separated color names: "Midnight, Silver, Space Gray"
    else {
      const subEntries = entry.split(",").map((s) => s.trim()).filter(Boolean);
      for (const s of subEntries) {
        colors.push({
          name: s,
          hex: getColorHexFromName(s),
        });
      }
    }
  }

  return colors;
}

/**
 * Helper default color hex for standard Apple color names
 */
function getColorHexFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("black") || n.includes("midnight") || n.includes("obsidian")) return "#1e2024";
  if (n.includes("white") || n.includes("starlight") || n.includes("cloud")) return "#fafafa";
  if (n.includes("silver") || n.includes("liquid")) return "#e2e2de";
  if (n.includes("gold") || n.includes("desert") || n.includes("celestial")) return "#ebd2a7";
  if (n.includes("blue") || n.includes("ultramarine")) return "#4169e1";
  if (n.includes("teal") || n.includes("sage") || n.includes("green") || n.includes("emerald")) return "#1e392e";
  if (n.includes("pink") || n.includes("rose") || n.includes("lavender")) return "#f5bbc9";
  if (n.includes("orange")) return "#a8563c";
  if (n.includes("red")) return "#c91f2e";
  if (n.includes("yellow")) return "#f0d060";
  if (n.includes("purple")) return "#a3a1d6";
  return "#71717a";
}

/**
 * Convert products array to CSV string
 */
export function productsToCSV(products: Product[]): string {
  const headers = [
    "slug",
    "name",
    "category",
    "price",
    "oldPrice",
    "badge",
    "tagline",
    "description",
    "image",
    "colors",
    "highlights",
  ];

  const rows = products.map((p) => [
    escapeCSVField(p.slug),
    escapeCSVField(p.name),
    escapeCSVField(p.category),
    escapeCSVField(p.price),
    escapeCSVField(p.oldPrice || ""),
    escapeCSVField(p.badge || ""),
    escapeCSVField(p.tagline || ""),
    escapeCSVField(p.description || ""),
    escapeCSVField(p.image || ""),
    escapeCSVField(serializeColors(p.colors)),
    escapeCSVField((p.highlights || []).join(" | ")),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Robust RFC 4180 CSV Parser that handles commas inside quotes and multiline cells.
 */
export function parseCSVRows(csvText: string): string[][] {
  // Strip BOM if present
  let text = csvText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
        i++;
        continue;
      } else if (char === "\r" || char === "\n") {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        currentRow.push(currentCell.trim());
        // Only push row if it contains non-empty cells
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  // Push final cell/row if any
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export interface CSVImportResult {
  products: Product[];
  errors: string[];
  warnings: string[];
  newCount: number;
  updateCount: number;
}

/**
 * Parse CSV text into Product objects with validation
 */
export function csvToProducts(
  csvText: string,
  existingProducts: Product[] = []
): CSVImportResult {
  const rawRows = parseCSVRows(csvText);
  const errors: string[] = [];
  const warnings: string[] = [];
  const products: Product[] = [];

  if (rawRows.length < 2) {
    errors.push("CSV file must contain at least a header row and one data row.");
    return { products: [], errors, warnings, newCount: 0, updateCount: 0 };
  }

  const rawHeaders = rawRows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  
  // Find column indices
  const getIndex = (aliases: string[]) => {
    for (const a of aliases) {
      const idx = rawHeaders.indexOf(a);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const slugIdx = getIndex(["slug", "id", "productslug"]);
  const nameIdx = getIndex(["name", "productname", "title"]);
  const categoryIdx = getIndex(["category", "cat", "collection"]);
  const priceIdx = getIndex(["price", "storeprice", "mrp"]);
  const oldPriceIdx = getIndex(["oldprice", "regularprice", "originalprice", "wasprice"]);
  const badgeIdx = getIndex(["badge", "status", "tag", "label"]);
  const taglineIdx = getIndex(["tagline", "subtitle", "caption"]);
  const descIdx = getIndex(["description", "desc", "details"]);
  const imageIdx = getIndex(["image", "imageurl", "photo", "cutout"]);
  const colorsIdx = getIndex(["colors", "finishes", "colour", "colours", "color"]);
  const highlightsIdx = getIndex(["highlights", "features", "specs", "bullets"]);

  if (nameIdx === -1 && slugIdx === -1) {
    errors.push("Missing required columns: CSV must contain at least 'name' or 'slug'.");
    return { products: [], errors, warnings, newCount: 0, updateCount: 0 };
  }

  const existingSlugMap = new Set(existingProducts.map((p) => p.slug.toLowerCase()));
  let newCount = 0;
  let updateCount = 0;

  for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];
    const rowNum = rowIndex + 1;

    const rawName = nameIdx >= 0 ? row[nameIdx] || "" : "";
    let rawSlug = slugIdx >= 0 ? row[slugIdx] || "" : "";

    if (!rawSlug && !rawName) {
      warnings.push(`Row #${rowNum}: Skipped empty row.`);
      continue;
    }

    if (!rawSlug) {
      rawSlug = rawName
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-");
    } else {
      rawSlug = rawSlug
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-");
    }

    const name = rawName || rawSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const category = (categoryIdx >= 0 ? row[categoryIdx] : "iphone") || "iphone";
    const price = (priceIdx >= 0 ? row[priceIdx] : "₹") || "₹";
    const oldPrice = oldPriceIdx >= 0 ? row[oldPriceIdx] : undefined;
    const badge = badgeIdx >= 0 ? row[badgeIdx] : undefined;
    const tagline = taglineIdx >= 0 ? row[taglineIdx] : undefined;
    const description = descIdx >= 0 ? row[descIdx] : undefined;
    const image = imageIdx >= 0 ? row[imageIdx] : undefined;

    // Parse colors
    const rawColors = colorsIdx >= 0 ? row[colorsIdx] : "";
    const parsedColors = parseColors(rawColors);

    // Parse highlights
    const rawHighlights = highlightsIdx >= 0 ? row[highlightsIdx] : "";
    const highlights = rawHighlights
      ? rawHighlights.split(/[|]+/).map((h) => h.trim()).filter(Boolean)
      : [];

    const product: Product = {
      slug: rawSlug,
      name,
      category: category.toLowerCase(),
      price: price.startsWith("₹") || price.toLowerCase().includes("coming") || price.toLowerCase().includes("preorder") ? price : `₹${price}`,
      ...(oldPrice ? { oldPrice } : {}),
      ...(badge ? { badge } : {}),
      tagline: tagline || `The standard of Apple ${category}.`,
      description: description || `${name} delivers exceptional performance, iconic Apple design and all-day battery life.`,
      ...(image ? { image } : {}),
      colors: parsedColors,
      highlights,
    };

    if (existingSlugMap.has(rawSlug)) {
      updateCount++;
    } else {
      newCount++;
    }

    products.push(product);
  }

  return { products, errors, warnings, newCount, updateCount };
}

/**
 * Generate a clean sample CSV template
 */
export function generateSampleCSV(): string {
  return `slug,name,category,price,oldPrice,badge,tagline,description,image,colors,highlights\r
iphone-17-pro,iPhone 17 Pro,iphone,"₹1,44,900","₹1,54,900",New,"Most advanced iPhone ever.","Titanium design, Pro camera system and all-day battery life.","https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=940&hei=1112&fmt=png-alpha","Cosmic Orange:#a8563c:https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=940&hei=1112&fmt=png-alpha; Deep Blue:#0b1736:https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium?wid=940&hei=1112&fmt=png-alpha; Silver:#e2e2de:https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-whitetitanium?wid=940&hei=1112&fmt=png-alpha","Up to 1TB storage | Best-in-class Pro camera system with 8x zoom | All-day battery life"\r
iphone-18-pro,iPhone 18 Pro,iphone,Preorder Now,,Preorder,"The future of Apple Intelligence.","Groundbreaking A20 Pro chip, revolutionary under-display camera architecture, and aerospace-grade liquid titanium casing.","https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium?wid=940&hei=1112&fmt=png-alpha","Cosmic Obsidian:#1e2024; Liquid Titanium:#b0b3b8; Celestial Gold:#ebd2a7; Deep Emerald:#1e392e","A20 Pro Quantum Bionic processor | ProMotion 2.0 Ultra XDR display | Next-gen 200MP fusion camera | 65W MagSafe 2"\r
macbook-air-13,MacBook Air 13,mac,"₹99,900","₹1,14,900",Newest chip,"Seriously thin. Seriously fast.","The world's most loved laptop, now with even more performance and battery life.","https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mba13-midnight-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90","Midnight:#1f2430; Starlight:#f2efe9; Silver:#e2e2de","Up to 18 hr battery life | Liquid Retina display | Fanless silent design"\r
apple-watch-ultra,Apple Watch Ultra,watch,"₹89,900",,Premium,"Adventure waits.","The most rugged and capable Apple Watch for every extreme.","https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ultra-case-unselect-gallery-1-202409?wid=940&hei=1112&fmt=png-alpha","Natural Titanium:#c9c4bd; Black:#333333","Most durable Watch ever | Precision dual-frequency GPS | Up to 72 hr battery life"`;
}

/**
 * Trigger browser file download for CSV content with UTF-8 BOM
 */
export function triggerCSVDownload(filename: string, csvContent: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
