import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const statusPromise = (async () => {
      const client = await getMongoClient();
      const db = client.db("apple_store");
      const ping = await db.command({ ping: 1 });

      const productsCount = await db.collection("products").countDocuments().catch(() => 0);
      const ordersCount = await db.collection("orders").countDocuments().catch(() => 0);
      const categoriesCount = await db.collection("categories").countDocuments().catch(() => 0);
      const enquiriesCount = await db.collection("enquiries").countDocuments().catch(() => 0);

      return {
        connected: true,
        ping,
        database: "apple_store",
        counts: {
          products: productsCount,
          orders: ordersCount,
          categories: categoriesCount,
          enquiries: enquiriesCount,
        },
      };
    })();

    const timeoutPromise = new Promise<{ connected: false; error: string; atlasHint: string }>((resolve) =>
      setTimeout(
        () =>
          resolve({
            connected: false,
            error: "Connection attempt timed out (> 3s).",
            atlasHint:
              "MongoDB Atlas Network Access: Please whitelist '0.0.0.0/0' (Allow Access From Anywhere) in MongoDB Atlas under Security -> Network Access.",
          }),
        3000
      )
    );

    const result = await Promise.race([statusPromise, timeoutPromise]);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      error: err?.message || "Failed to connect to MongoDB",
      code: err?.code,
      codeName: err?.codeName,
      atlasHint:
        err?.code === 8000
          ? "Authentication failed: Please check your username and password in Atlas under 'Database Access'."
          : "MongoDB Atlas Network Access: Please add IP address '0.0.0.0/0' (Allow access from anywhere) in Atlas -> Network Access.",
    });
  }
}
