import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return NextResponse.json({
      connected: false,
      error: "MONGODB_URI is not set in environment variables (.env.local)",
    });
  }

  if (!clientPromise) {
    return NextResponse.json({
      connected: false,
      error: "MongoDB client promise not initialized",
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("apple_store");
    const ping = await db.command({ ping: 1 });

    const productsCount = await db.collection("products").countDocuments();
    const ordersCount = await db.collection("orders").countDocuments();
    const categoriesCount = await db.collection("categories").countDocuments();

    return NextResponse.json({
      connected: true,
      ping,
      database: "apple_store",
      counts: {
        products: productsCount,
        orders: ordersCount,
        categories: categoriesCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      error: err?.message || "Failed to connect to MongoDB",
      code: err?.code,
      codeName: err?.codeName,
      atlasHint:
        err?.code === 8000
          ? "Authentication failed: Please check your username and password in Atlas under 'Database Access'."
          : "Please check Network Access (IP Whitelist) in MongoDB Atlas.",
    });
  }
}
