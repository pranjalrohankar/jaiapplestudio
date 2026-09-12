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

// GET all enquiries (Instant local response with fast MongoDB background sync)
export async function GET() {
  const localEnquiries = readLocalEnquiries();
  localEnquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Fast check: If MongoDB is connected and responds in < 300ms, use it; otherwise return local immediately
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");
        return await db
          .collection("enquiries")
          .find({}, { projection: { _id: 0 } })
          .sort({ createdAt: -1 })
          .toArray();
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 350));
      const mongoEnquiries = await Promise.race([mongoPromise, timeoutPromise]);

      if (mongoEnquiries && Array.isArray(mongoEnquiries) && mongoEnquiries.length > 0) {
        return NextResponse.json({ enquiries: mongoEnquiries, source: "mongodb" });
      }
    } catch (mongoError) {
      // Continue to local enquiries
    }
  }

  return NextResponse.json({ enquiries: localEnquiries, source: "local" });
}

// POST a new customer enquiry
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEnquiry = body.enquiry || body;

    if (!rawEnquiry || !rawEnquiry.name || !rawEnquiry.phone) {
      return NextResponse.json({ error: "Name and Phone number are required" }, { status: 400 });
    }

    const now = new Date();
    const newEnquiry: EnquiryRecord = {
      enquiryNo:
        rawEnquiry.enquiryNo ||
        `ENQ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`,
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

    // 1. Always persist locally first (instant response)
    const enquiries = readLocalEnquiries();
    const existingIndex = enquiries.findIndex((e) => e.enquiryNo === newEnquiry.enquiryNo);
    if (existingIndex >= 0) {
      enquiries[existingIndex] = newEnquiry;
    } else {
      enquiries.unshift(newEnquiry);
    }
    writeLocalEnquiries(enquiries);

    let savedToMongo = false;

    // 2. Sync to MongoDB Atlas safely with timeout
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("enquiries").updateOne(
            { enquiryNo: newEnquiry.enquiryNo },
            { $set: newEnquiry },
            { upsert: true }
          );
          return true;
        })();

        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500));
        savedToMongo = await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not save enquiry to MongoDB, saved locally:", mongoError);
      }
    }

    return NextResponse.json({
      success: true,
      enquiry: newEnquiry,
      savedToMongo,
      enquiries,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to record enquiry" }, { status: 500 });
  }
}

// PATCH an enquiry status, admin note, or assignment
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { enquiryNo, status, adminNote, priority } = body;

    if (!enquiryNo) {
      return NextResponse.json({ error: "Enquiry number required" }, { status: 400 });
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
        })();
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not update enquiry in MongoDB:", mongoError);
      }
    }

    return NextResponse.json({ success: true, enquiry: updatedEnquiry, enquiries });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update enquiry" }, { status: 500 });
  }
}

// DELETE an enquiry
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const enquiryNo = searchParams.get("enquiryNo");

    if (!enquiryNo) {
      return NextResponse.json({ error: "Enquiry number required" }, { status: 400 });
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
        })();
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await Promise.race([deletePromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not delete enquiry in MongoDB:", mongoError);
      }
    }

    return NextResponse.json({ success: true, enquiries });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete enquiry" }, { status: 500 });
  }
}
