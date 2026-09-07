import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs";
import path from "path";

const ordersFilePath = path.join(process.cwd(), "data", "orders.json");

export type OrderItem = {
  name: string;
  color?: string;
  variant?: string;
  qty: number;
  price: number;
  priceLabel: string;
  image?: string;
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

// GET all orders (MongoDB with local fallback)
export async function GET() {
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const mongoOrders = await db
        .collection("orders")
        .find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .toArray();

      if (mongoOrders && mongoOrders.length > 0) {
        return NextResponse.json({ orders: mongoOrders, source: "mongodb" });
      }
    } catch (mongoError) {
      console.warn("MongoDB orders fetch failed, falling back to local file:", mongoError);
    }
  }

  const orders = readLocalOrders();
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ orders, source: "local" });
}

// POST a new order (Saves to MongoDB and local file)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newOrder: OrderRecord = body.order;

    if (!newOrder || !newOrder.orderNo) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    let savedToMongo = false;

    // 1. Save to MongoDB Atlas if connected
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        await db.collection("orders").updateOne(
          { orderNo: newOrder.orderNo },
          { $set: newOrder },
          { upsert: true }
        );
        savedToMongo = true;
      } catch (mongoError) {
        console.warn("Could not save order to MongoDB:", mongoError);
      }
    }

    // 2. Always persist locally
    const orders = readLocalOrders();
    const existingIndex = orders.findIndex((o) => o.orderNo === newOrder.orderNo);
    if (existingIndex >= 0) {
      orders[existingIndex] = newOrder;
    } else {
      orders.unshift(newOrder);
    }
    writeLocalOrders(orders);

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

    let updatedOrder: OrderRecord | null = null;

    // 1. Update in MongoDB
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        const updateFields: any = {};
        if (status) updateFields.status = status;
        if (adminNote !== undefined) updateFields.adminNote = adminNote;

        await db.collection("orders").updateOne({ orderNo }, { $set: updateFields });
      } catch (mongoError) {
        console.warn("Could not update order in MongoDB:", mongoError);
      }
    }

    // 2. Update locally
    const orders = readLocalOrders();
    const index = orders.findIndex((o) => o.orderNo === orderNo);
    if (index !== -1) {
      if (status) orders[index].status = status;
      if (adminNote !== undefined) orders[index].adminNote = adminNote;
      writeLocalOrders(orders);
      updatedOrder = orders[index];
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

    // 1. Delete in MongoDB
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        await db.collection("orders").deleteOne({ orderNo });
      } catch (mongoError) {
        console.warn("Could not delete order in MongoDB:", mongoError);
      }
    }

    // 2. Delete locally
    let orders = readLocalOrders();
    orders = orders.filter((o) => o.orderNo !== orderNo);
    writeLocalOrders(orders);

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete order" }, { status: 500 });
  }
}
