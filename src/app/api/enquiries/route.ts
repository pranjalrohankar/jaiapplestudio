import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs";
import path from "path";
import type { EnquiryRecord } from "@/lib/enquiry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const enquiriesFilePath = path.join(process.cwd(), "data", "enquiries.json");
const ordersFilePath = path.join(process.cwd(), "data", "orders.json");

function readLocalJson<T>(filePath: string, key: string): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed[key]) ? parsed[key] : [];
  } catch (err) {
    return [];
  }
}

function writeLocalEnquiries(enquiries: EnquiryRecord[]) {
  try {
    const dir = path.dirname(enquiriesFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(enquiriesFilePath, JSON.stringify({ enquiries }, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing enquiries.json:", err);
  }
}

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function generateUniqueEnquiryNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dateTag = `${y}${m}${d}`;
  const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ENQ-${dateTag}-${timeSuffix}${randomSuffix}`;
}

function normalizeOrderToEnquiry(order: any): EnquiryRecord {
  const items = Array.isArray(order.items) ? order.items : [];
  const primaryItem = items[0]?.name || "Apple Product";
  const itemsSummary = items.map((i: any) => `${i.qty || 1}x ${i.name || ""}${i.variant ? ` (${i.variant})` : ""}`).join(", ");

  return {
    enquiryNo: order.orderNo || order.enquiryNo || generateUniqueEnquiryNo(),
    name: order.customerName || order.name || "Customer",
    phone: order.customerPhone || order.phone || "",
    email: order.email || "",
    city: order.customerCity || order.city || "",
    product: primaryItem,
    productName: itemsSummary || primaryItem,
    productSlug: order.productSlug || "",
    items: items,
    subtotal: order.subtotal || 0,
    totalDisplay: order.totalDisplay || (order.subtotal ? `₹${order.subtotal.toLocaleString("en-IN")}` : ""),
    message: order.customerNote || order.message || itemsSummary || "Cart order submitted via store.",
    budget: order.totalDisplay || (order.subtotal ? `₹${order.subtotal.toLocaleString("en-IN")}` : ""),
    source: "cart_checkout",
    status: order.status || "New",
    adminNote: order.adminNote || "",
    date: order.date || new Date().toLocaleDateString("en-IN"),
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt,
  };
}

// GET all enquiries and orders unified (One central sheet for all customer requests)
export async function GET() {
  const localEnquiries = readLocalJson<EnquiryRecord>(enquiriesFilePath, "enquiries");
  const localOrders = readLocalJson<any>(ordersFilePath, "orders").map(normalizeOrderToEnquiry);

  let mongoEnquiries: EnquiryRecord[] = [];
  let mongoOrders: EnquiryRecord[] = [];

  // 1. Fetch from MongoDB Atlas (enquiries + orders collections)
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");

      const [enquiryDocs, orderDocs] = await Promise.all([
        db.collection("enquiries").find({}).sort({ createdAt: -1 }).toArray().catch(() => []),
        db.collection("orders").find({}).sort({ createdAt: -1 }).toArray().catch(() => []),
      ]);

      mongoEnquiries = enquiryDocs.map((doc: any) => {
        const { _id, ...rest } = doc;
        return rest as EnquiryRecord;
      });

      mongoOrders = orderDocs.map((doc: any) => {
        const { _id, ...rest } = doc;
        return normalizeOrderToEnquiry(rest);
      });
    } catch (mongoError) {
      console.warn("MongoDB fetch unified enquiries failed:", mongoError);
    }
  }

  // 2. Merge all sources into a single deduplicated Map keyed by enquiryNo / orderNo
  const unifiedMap = new Map<string, EnquiryRecord>();

  // Add Mongo enquiries
  for (const item of mongoEnquiries) {
    if (item && item.enquiryNo) {
      unifiedMap.set(item.enquiryNo, item);
    }
  }

  // Add Mongo orders
  for (const item of mongoOrders) {
    if (item && item.enquiryNo) {
      if (!unifiedMap.has(item.enquiryNo)) {
        unifiedMap.set(item.enquiryNo, item);
      }
    }
  }

  // Add local enquiries
  for (const item of localEnquiries) {
    if (item && item.enquiryNo) {
      if (!unifiedMap.has(item.enquiryNo)) {
        unifiedMap.set(item.enquiryNo, item);
      }
    }
  }

  // Add local orders
  for (const item of localOrders) {
    if (item && item.enquiryNo) {
      if (!unifiedMap.has(item.enquiryNo)) {
        unifiedMap.set(item.enquiryNo, item);
      }
    }
  }

  // Build sorted array (newest first)
  const allMerged = Array.from(unifiedMap.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime() || 0;
    const timeB = new Date(b.createdAt || b.date).getTime() || 0;
    return timeB - timeA;
  });

  // Keep local backup updated
  if (allMerged.length > localEnquiries.length) {
    writeLocalEnquiries(allMerged);
  }

  return NextResponse.json(
    {
      enquiries: allMerged,
      totalCount: allMerged.length,
      source: mongoEnquiries.length > 0 || mongoOrders.length > 0 ? "mongodb+synced" : "local",
    },
    { headers: NO_CACHE_HEADERS }
  );
}

// POST a new customer enquiry or cart order
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = body.enquiry || body.order || body;

    const name = (raw.name || raw.customerName || "").trim();
    const phone = (raw.phone || raw.customerPhone || "").trim();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and Phone number are required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const now = new Date();
    const existingLocal = readLocalJson<EnquiryRecord>(enquiriesFilePath, "enquiries");

    let finalEnquiryNo = (raw.enquiryNo || raw.orderNo || "").trim();
    if (!finalEnquiryNo || existingLocal.some((e) => e.enquiryNo === finalEnquiryNo)) {
      finalEnquiryNo = generateUniqueEnquiryNo();
    }

    const items = Array.isArray(raw.items) ? raw.items : [];
    const primaryItem = raw.product || raw.productName || items[0]?.name || "General Enquiry";

    const newEnquiry: EnquiryRecord = {
      enquiryNo: finalEnquiryNo,
      name,
      phone,
      email: (raw.email || "").trim(),
      city: (raw.city || raw.customerCity || "").trim(),
      product: primaryItem,
      productName: raw.productName || primaryItem,
      productSlug: raw.productSlug || "",
      items: items.length > 0 ? items : undefined,
      subtotal: raw.subtotal || undefined,
      totalDisplay: raw.totalDisplay || (raw.subtotal ? `₹${raw.subtotal.toLocaleString("en-IN")}` : undefined),
      message: (raw.message || raw.customerNote || "").trim(),
      budget: (raw.budget || raw.totalDisplay || "").trim(),
      preferredVariant: (raw.preferredVariant || "").trim(),
      preferredColor: (raw.preferredColor || "").trim(),
      source: raw.source || (items.length > 0 ? "cart_checkout" : "contact_page"),
      status: raw.status || "New",
      adminNote: raw.adminNote || "",
      date:
        raw.date ||
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      createdAt: raw.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // 1. Prepend to local storage
    const updatedLocal = [newEnquiry, ...existingLocal.filter((e) => e.enquiryNo !== finalEnquiryNo)];
    writeLocalEnquiries(updatedLocal);

    let savedToMongo = false;

    // 2. Insert into MongoDB Atlas
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        await db.collection("enquiries").insertOne({ ...newEnquiry });
        // If it is a cart order, also insert into orders collection for backward compatibility
        if (newEnquiry.source === "cart_checkout" || items.length > 0) {
          await db.collection("orders").updateOne(
            { orderNo: finalEnquiryNo },
            {
              $set: {
                orderNo: finalEnquiryNo,
                customerName: name,
                customerPhone: phone,
                customerCity: newEnquiry.city,
                customerNote: newEnquiry.message,
                items,
                subtotal: newEnquiry.subtotal || 0,
                totalDisplay: newEnquiry.totalDisplay || "",
                status: newEnquiry.status,
                adminNote: newEnquiry.adminNote,
                date: newEnquiry.date,
                createdAt: newEnquiry.createdAt,
              },
            },
            { upsert: true }
          );
        }
        savedToMongo = true;
      } catch (mongoError) {
        console.warn("Could not insert enquiry into MongoDB, saved locally:", mongoError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        enquiry: newEnquiry,
        savedToMongo,
        enquiries: updatedLocal,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to record enquiry" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PATCH an enquiry/order status or note
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { enquiryNo, orderNo, status, adminNote, priority } = body;
    const targetRef = enquiryNo || orderNo;

    if (!targetRef) {
      return NextResponse.json(
        { error: "Enquiry or Order reference required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Update locally
    const enquiries = readLocalJson<EnquiryRecord>(enquiriesFilePath, "enquiries");
    const index = enquiries.findIndex((e) => e.enquiryNo === targetRef);
    let updatedEnquiry: EnquiryRecord | null = null;
    const nowIso = new Date().toISOString();

    if (index !== -1) {
      if (status) enquiries[index].status = status;
      if (adminNote !== undefined) enquiries[index].adminNote = adminNote;
      enquiries[index].updatedAt = nowIso;
      writeLocalEnquiries(enquiries);
      updatedEnquiry = enquiries[index];
    }

    // 2. Update in MongoDB Atlas in both enquiries and orders collections
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        const updateFields: any = { updatedAt: nowIso };
        if (status) updateFields.status = status;
        if (adminNote !== undefined) updateFields.adminNote = adminNote;
        if (priority !== undefined) updateFields.priority = priority;

        await Promise.all([
          db.collection("enquiries").updateOne({ enquiryNo: targetRef }, { $set: updateFields }),
          db.collection("orders").updateOne({ orderNo: targetRef }, { $set: updateFields }),
        ]);
      } catch (mongoError) {
        console.warn("Could not update enquiry in MongoDB:", mongoError);
      }
    }

    return NextResponse.json(
      { success: true, enquiry: updatedEnquiry, enquiries },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update enquiry" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE an enquiry/order
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetRef = searchParams.get("enquiryNo") || searchParams.get("orderNo");

    if (!targetRef) {
      return NextResponse.json(
        { error: "Enquiry or Order reference required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Delete locally
    let enquiries = readLocalJson<EnquiryRecord>(enquiriesFilePath, "enquiries");
    enquiries = enquiries.filter((e) => e.enquiryNo !== targetRef);
    writeLocalEnquiries(enquiries);

    // 2. Delete from MongoDB Atlas
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        await Promise.all([
          db.collection("enquiries").deleteOne({ enquiryNo: targetRef }),
          db.collection("orders").deleteOne({ orderNo: targetRef }),
        ]);
      } catch (mongoError) {
        console.warn("Could not delete from MongoDB:", mongoError);
      }
    }

    return NextResponse.json({ success: true, enquiries }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete enquiry" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
