import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ordersFilePath = path.join(process.cwd(), "data", "orders.json");

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

export type OrderRecord = {
  orderNo: string;
  date: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  customerNote?: string;
  items: OrderItem[];
  subtotal: number;
  totalDisplay: string;
  status: "New" | "Contacted" | "Confirmed" | "Dispatched" | "Delivered" | "Cancelled";
  adminNote?: string;
};

function readLocalOrders(): OrderRecord[] {
  try {
    if (!fs.existsSync(ordersFilePath)) {
      return [];
    }
    const raw = fs.readFileSync(ordersFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.orders) ? parsed.orders : [];
  } catch (err) {
    console.error("Error reading orders.json:", err);
    return [];
  }
}

function writeLocalOrders(orders: OrderRecord[]) {
  try {
    const dir = path.dirname(ordersFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ordersFilePath, JSON.stringify({ orders }, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing orders.json:", err);
  }
}

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function generateUniqueOrderNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dateTag = `${y}${m}${d}`;
  const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JAS-${dateTag}-${timeSuffix}${randomSuffix}`;
}

// GET all orders (Robust bidirectional merge so no order is ever lost)
export async function GET() {
  const localOrders = readLocalOrders();
  let mongoOrders: OrderRecord[] = [];

  // 1. Fetch from MongoDB Atlas
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");
        const docs = await db
          .collection("orders")
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        return docs.map((doc: any) => {
          const { _id, ...rest } = doc;
          return rest as OrderRecord;
        });
      })();

      const timeoutPromise = new Promise<OrderRecord[]>((resolve) =>
        setTimeout(() => resolve([]), 4000)
      );
      mongoOrders = await Promise.race([mongoPromise, timeoutPromise]);
    } catch (mongoError) {
      console.warn("MongoDB fetch orders failed:", mongoError);
    }
  }

  // 2. Merge Mongo & Local by orderNo
  const orderMap = new Map<string, OrderRecord>();

  // Add Mongo records first
  for (const item of mongoOrders) {
    if (item && item.orderNo) {
      orderMap.set(item.orderNo, item);
    }
  }

  // Add local records missing in Mongo
  const missingInMongo: OrderRecord[] = [];
  for (const item of localOrders) {
    if (item && item.orderNo) {
      if (!orderMap.has(item.orderNo)) {
        orderMap.set(item.orderNo, item);
        missingInMongo.push(item);
      }
    }
  }

  // Sync missing in background
  if (missingInMongo.length > 0 && clientPromise) {
    (async () => {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        for (const missing of missingInMongo) {
          await db.collection("orders").updateOne(
            { orderNo: missing.orderNo },
            { $set: missing },
            { upsert: true }
          );
        }
      } catch (err) {
        console.warn("Background sync of missing orders to Mongo failed:", err);
      }
    })().catch(() => {});
  }

  // Build sorted array
  const mergedOrders = Array.from(orderMap.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime() || 0;
    const timeB = new Date(b.createdAt || b.date).getTime() || 0;
    return timeB - timeA;
  });

  if (mergedOrders.length > localOrders.length) {
    writeLocalOrders(mergedOrders);
  }

  return NextResponse.json(
    {
      orders: mergedOrders,
      source: mongoOrders.length > 0 ? "mongodb+synced" : "local",
    },
    { headers: NO_CACHE_HEADERS }
  );
}

// POST a new order (Guaranteed unique, never overwrites)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawOrder: OrderRecord = body.order || body;

    if (!rawOrder) {
      return NextResponse.json(
        { error: "Invalid order data" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const existingLocal = readLocalOrders();
    let finalOrderNo = (rawOrder.orderNo || "").trim();
    if (!finalOrderNo || existingLocal.some((o) => o.orderNo === finalOrderNo)) {
      finalOrderNo = generateUniqueOrderNo();
    }

    const now = new Date();
    const newOrder: OrderRecord = {
      ...rawOrder,
      orderNo: finalOrderNo,
      date:
        rawOrder.date ||
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      createdAt: rawOrder.createdAt || now.toISOString(),
      status: rawOrder.status || "New",
    };

    // 1. Prepend to local storage
    const updatedLocal = [newOrder, ...existingLocal.filter((o) => o.orderNo !== finalOrderNo)];
    writeLocalOrders(updatedLocal);

    let savedToMongo = false;

    // 2. Insert into MongoDB Atlas (insertOne to guarantee fresh separate document)
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("orders").insertOne({ ...newOrder });
          return true;
        })();

        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 5000)
        );
        savedToMongo = await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not insert order into MongoDB, saved locally:", mongoError);
      }
    }

    return NextResponse.json(
      { success: true, order: newOrder, savedToMongo, orders: updatedLocal },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to record order" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PATCH an order status or note
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderNo, status, adminNote } = body;

    if (!orderNo) {
      return NextResponse.json(
        { error: "Order number required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Update locally first
    const orders = readLocalOrders();
    const index = orders.findIndex((o) => o.orderNo === orderNo);
    let updatedOrder: OrderRecord | null = null;
    if (index !== -1) {
      if (status) orders[index].status = status;
      if (adminNote !== undefined) orders[index].adminNote = adminNote;
      writeLocalOrders(orders);
      updatedOrder = orders[index];
    }

    // 2. Update in MongoDB safely
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          const updateFields: any = {};
          if (status) updateFields.status = status;
          if (adminNote !== undefined) updateFields.adminNote = adminNote;
          await db.collection("orders").updateOne({ orderNo }, { $set: updateFields });
          return true;
        })();
        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 5000)
        );
        await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not update order in MongoDB:", mongoError);
      }
    }

    return NextResponse.json(
      { success: true, order: updatedOrder, orders },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update order" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE an order
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get("orderNo");

    if (!orderNo) {
      return NextResponse.json(
        { error: "Order number required" },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Delete locally first
    let orders = readLocalOrders();
    orders = orders.filter((o) => o.orderNo !== orderNo);
    writeLocalOrders(orders);

    // 2. Delete in MongoDB safely
    if (clientPromise) {
      try {
        const deletePromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("orders").deleteOne({ orderNo });
          return true;
        })();
        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), 5000)
        );
        await Promise.race([deletePromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not delete order in MongoDB:", mongoError);
      }
    }

    return NextResponse.json({ success: true, orders }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete order" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
