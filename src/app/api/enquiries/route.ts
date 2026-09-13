import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs";
import path from "path";
import type { EnquiryRecord } from "@/lib/enquiry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const enquiriesFilePath = path.join(process.cwd(), "data", "enquiries.json");

function readLocalEnquiries(): EnquiryRecord[] {
  try {
    if (!fs.existsSync(enquiriesFilePath)) {
      return [];
    }
    const raw = fs.readFileSync(enquiriesFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.enquiries) ? parsed.enquiries : [];
  } catch (err) {
    console.error("Error reading enquiries.json:", err);
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

// GET all enquiries (Robust bidirectional merge so no enquiry is ever lost)
export async function GET() {
  const localEnquiries = readLocalEnquiries();
  let mongoEnquiries: EnquiryRecord[] = [];

  // 1. Fetch from MongoDB Atlas
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");
        const docs = await db
          .collection("enquiries")
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        return docs.map((doc: any) => {
          const { _id, ...rest } = doc;
          return rest as EnquiryRecord;
        });
      })();

      const timeoutPromise = new Promise<EnquiryRecord[]>((resolve) =>
        setTimeout(() => resolve([]), 4000)
      );
      mongoEnquiries = await Promise.race([mongoPromise, timeoutPromise]);
    } catch (mongoError) {
      console.warn("MongoDB fetch enquiries failed:", mongoError);
    }
  }

  // 2. Merge Mongo & Local by enquiryNo
  const enquiryMap = new Map<string, EnquiryRecord>();

  // Add Mongo records first
  for (const item of mongoEnquiries) {
    if (item && item.enquiryNo) {
      enquiryMap.set(item.enquiryNo, item);
    }
  }

  // Add local records that might not be in Mongo yet
  const missingInMongo: EnquiryRecord[] = [];
  for (const item of localEnquiries) {
    if (item && item.enquiryNo) {
      if (!enquiryMap.has(item.enquiryNo)) {
        enquiryMap.set(item.enquiryNo, item);
        missingInMongo.push(item);
      }
    }
  }

  // If local had records missing in Mongo, background sync them
  if (missingInMongo.length > 0 && clientPromise) {
    (async () => {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        for (const missing of missingInMongo) {
          await db.collection("enquiries").updateOne(
            { enquiryNo: missing.enquiryNo },
            { $set: missing },
            { upsert: true }
          );
        }
      } catch (err) {
        console.warn("Background sync of missing enquiries to Mongo failed:", err);
      }
    })().catch(() => {});
  }

  // Build sorted array (newest first)
  const mergedEnquiries = Array.from(enquiryMap.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime() || 0;
    const timeB = new Date(b.createdAt || b.date).getTime() || 0;
    return timeB - timeA;
  });

  // Keep local storage up to date with full list
  if (mergedEnquiries.length > localEnquiries.length) {
    writeLocalEnquiries(mergedEnquiries);
  }

  return NextResponse.json(
    {
      enquiries: mergedEnquiries,
      source: mongoEnquiries.length > 0 ? "mongodb+synced" : "local",
    },
    { headers: NO_CACHE_HEADERS }
  );
}

// POST a new customer enquiry (Guaranteed unique, never overwrites)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEnquiry = body.enquiry || body;

    if (!rawEnquiry || !rawEnquiry.name || !rawEnquiry.phone) {
      return NextResponse.json(
        { error: "Name and Phone number are required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const now = new Date();
    const existingLocal = readLocalEnquiries();

    // Determine clean and unique enquiryNo
    let finalEnquiryNo = (rawEnquiry.enquiryNo || "").trim();
    if (!finalEnquiryNo || existingLocal.some((e) => e.enquiryNo === finalEnquiryNo)) {
      finalEnquiryNo = generateUniqueEnquiryNo();
    }

    const newEnquiry: EnquiryRecord = {
      enquiryNo: finalEnquiryNo,
      name: rawEnquiry.name.trim(),
      phone: rawEnquiry.phone.trim(),
      email: rawEnquiry.email?.trim() || "",
      product: rawEnquiry.product || rawEnquiry.productName || "General Enquiry",
      productName: rawEnquiry.productName || rawEnquiry.product || "General Enquiry",
      productSlug: rawEnquiry.productSlug || "",
      message: rawEnquiry.message?.trim() || "",
      budget: rawEnquiry.budget?.trim() || "",
      preferredVariant: rawEnquiry.preferredVariant?.trim() || "",
      preferredColor: rawEnquiry.preferredColor?.trim() || "",
      source: rawEnquiry.source || "contact_page",
      status: rawEnquiry.status || "New",
      adminNote: rawEnquiry.adminNote || "",
      date:
        rawEnquiry.date ||
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      createdAt: rawEnquiry.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // 1. Prepend to local storage (never overwrite different records)
    const updatedLocal = [newEnquiry, ...existingLocal.filter((e) => e.enquiryNo !== finalEnquiryNo)];
    writeLocalEnquiries(updatedLocal);

    let savedToMongo = false;

    // 2. Insert into MongoDB Atlas (insertOne to guarantee fresh separate document)
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("enquiries").insertOne({ ...newEnquiry });
          return true;
        })();

        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 5000)
        );
        savedToMongo = await Promise.race([syncPromise, timeoutPromise]);
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

// PATCH an enquiry status, admin note, or assignment
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { enquiryNo, status, adminNote, priority } = body;

    if (!enquiryNo) {
      return NextResponse.json(
        { error: "Enquiry number required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Update locally first
    const enquiries = readLocalEnquiries();
    const index = enquiries.findIndex((e) => e.enquiryNo === enquiryNo);
    let updatedEnquiry: EnquiryRecord | null = null;
    const nowIso = new Date().toISOString();

    if (index !== -1) {
      if (status) enquiries[index].status = status;
      if (adminNote !== undefined) enquiries[index].adminNote = adminNote;
      enquiries[index].updatedAt = nowIso;
      writeLocalEnquiries(enquiries);
      updatedEnquiry = enquiries[index];
    }

    // 2. Update in MongoDB safely
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          const updateFields: any = { updatedAt: nowIso };
          if (status) updateFields.status = status;
          if (adminNote !== undefined) updateFields.adminNote = adminNote;
          if (priority !== undefined) updateFields.priority = priority;
          await db.collection("enquiries").updateOne({ enquiryNo }, { $set: updateFields });
          return true;
        })();
        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 5000)
        );
        await Promise.race([syncPromise, timeoutPromise]);
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

// DELETE an enquiry
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const enquiryNo = searchParams.get("enquiryNo");

    if (!enquiryNo) {
      return NextResponse.json(
        { error: "Enquiry number required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Delete locally first
    let enquiries = readLocalEnquiries();
    enquiries = enquiries.filter((e) => e.enquiryNo !== enquiryNo);
    writeLocalEnquiries(enquiries);

    // 2. Delete in MongoDB safely
    if (clientPromise) {
      try {
        const deletePromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("enquiries").deleteOne({ enquiryNo });
          return true;
        })();
        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 5000)
        );
        await Promise.race([deletePromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not delete enquiry in MongoDB:", mongoError);
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
