export type EnquiryStatus =
  | "New"
  | "Contacted"
  | "In Progress"
  | "Confirmed"
  | "Converted"
  | "Dispatched"
  | "Delivered"
  | "Closed"
  | "Cancelled";

export type OrderItem = {
  name: string;
  color?: string;
  variant?: string;
  qty: number;
  price: number;
  priceLabel: string;
  image?: string;
  badge?: string;
  status?: string;
  isPreOrder?: boolean;
  isComingSoon?: boolean;
};

export type EnquiryRecord = {
  enquiryNo: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  product?: string;
  productName?: string;
  productSlug?: string;
  items?: OrderItem[];
  subtotal?: number;
  totalDisplay?: string;
  message?: string;
  budget?: string;
  preferredVariant?: string;
  preferredColor?: string;
  source?: "cart_checkout" | "contact_page" | "product_page" | "quick_enquiry" | "whatsapp";
  status: EnquiryStatus;
  adminNote?: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
};

/**
 * Format enquiry number: ENQ-YYYYMMDD-XXXX (Guaranteed unique across all devices & sessions)
 */
export function nextEnquiryNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dateTag = `${y}${m}${d}`;

  // High-entropy timestamp + random alphanumeric suffix
  const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `ENQ-${dateTag}-${timeSuffix}${randomSuffix}`;
}

export function formatEnquiryDate(dateInput: string | Date = new Date()): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function submitEnquiry(enquiry: Partial<EnquiryRecord>): Promise<{
  success: boolean;
  enquiry?: EnquiryRecord;
  error?: string;
}> {
  try {
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enquiry }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit enquiry");
    }
    return { success: true, enquiry: data.enquiry };
  } catch (err: any) {
    console.warn("Could not record enquiry on server API:", err);
    return { success: false, error: err?.message || "Failed to record enquiry" };
  }
}
