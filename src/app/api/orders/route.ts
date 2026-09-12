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

// GET all orders (Instant local response with fast background sync)
export async function GET() {
  const localOrders = readLocalOrders();
  localOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Fast check: If MongoDB is connected and responds in < 300ms, use it; otherwise return local immediately
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");
        return await db
          .collection("orders")
          .find({}, { projection: { _id: 0 } })
          .sort({ createdAt: -1 })
          .toArray();
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 300));
      const mongoOrders = await Promise.race([mongoPromise, timeoutPromise]);

      if (mongoOrders && Array.isArray(mongoOrders) && mongoOrders.length > 0) {
        return NextResponse.json({ orders: mongoOrders, source: "mongodb" });
      }
    } catch (mongoError) {
      // Continue to local orders
    }
  }

  return NextResponse.json({ orders: localOrders, source: "local" });
}

// POST a new order (Saves locally first for instant checkout, then syncs to MongoDB)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newOrder: OrderRecord = body.order;

    if (!newOrder || !newOrder.orderNo) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    // 1. Always persist locally first (instant < 2ms)
    const orders = readLocalOrders();
    const existingIndex = orders.findIndex((o) => o.orderNo === newOrder.orderNo);
    if (existingIndex >= 0) {
      orders[existingIndex] = newOrder;
    } else {
      orders.unshift(newOrder);
    }
    writeLocalOrders(orders);

    let savedToMongo = false;

    // 2. Sync to MongoDB Atlas safely with timeout
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("orders").updateOne(
            { orderNo: newOrder.orderNo },
            { $set: newOrder },
            { upsert: true }
          );
          return true;
        })();

        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500));
        savedToMongo = await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not save order to MongoDB, saved locally:", mongoError);
      }
    }

    return NextResponse.json({ success: true, order: newOrder, savedToMongo, orders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to record order" }, { status: 500 });
  }
}

// PATCH an order status or note
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderNo, status, adminNote } = body;

    if (!orderNo) {
      return NextResponse.json({ error: "Order number required" }, { status: 400 });
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
        })();
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not update order in MongoDB:", mongoError);
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder, orders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update order" }, { status: 500 });
  }
}

// DELETE an order
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get("orderNo");

    if (!orderNo) {
      return NextResponse.json({ error: "Order number required" }, { status: 400 });
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
        })();
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1500));
        await Promise.race([deletePromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("Could not delete order in MongoDB:", mongoError);
      }
    }

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete order" }, { status: 500 });
  }
}
