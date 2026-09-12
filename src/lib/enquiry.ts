export type EnquiryStatus =
  | "New"
  | "Contacted"
  | "In Progress"
  | "Converted"
  | "Closed"
  | "Cancelled";

export type EnquiryRecord = {
  enquiryNo: string;
  name: string;
  phone: string;
  email?: string;
  product?: string;
  productName?: string;
  productSlug?: string;
  message?: string;
  budget?: string;
  preferredVariant?: string;
  preferredColor?: string;
  source?: "contact_page" | "product_page" | "quick_enquiry" | "whatsapp";
  status: EnquiryStatus;
  adminNote?: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
};

/**
 * Format enquiry number: ENQ-YYYYMMDD-001
 */
export function nextEnquiryNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dateTag = `${y}${m}${d}`;

  const key = `jas-enquiry-${dateTag}`;
  let last = 0;
  try {
    if (typeof window !== "undefined") {
      last = Number(window.localStorage.getItem(key) ?? "0") || 0;
    }
  } catch {
    // ignore
  }

  const n = last + 1;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, String(n));
    }
  } catch {
    // ignore
  }

  return `ENQ-${dateTag}-${String(n).padStart(3, "0")}`;
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
