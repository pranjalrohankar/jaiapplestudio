import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/products.json";

const dataFilePath = path.join(process.cwd(), "data", "products.json");

export async function GET() {
  // 1. Read from local data/products.json (instant < 2ms)
  try {
    const fileContent = await fs.readFile(dataFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && (Array.isArray(data.products) || Array.isArray(data.categories))) {
      return NextResponse.json({
        categories: data.categories || fallbackData.categories || [],
        products: data.products || fallbackData.products || [],
      });
    }
  } catch (fileError) {
    // If local read fails, continue to MongoDB / fallback
  }

  // 2. Try MongoDB if local file is missing
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      
      const categories = await db.collection("categories").find({}, { projection: { _id: 0 } }).toArray();
      const products = await db.collection("products").find({}, { projection: { _id: 0 } }).toArray();

      if (products.length > 0 || categories.length > 0) {
        return NextResponse.json({ categories, products });
      }
    } catch (error) {
      console.warn("MongoDB fetch failed, using fallback:", error);
    }
  }

  // 3. Fallback
  return NextResponse.json({
    categories: fallbackData.categories || [],
    products: fallbackData.products || [],
  });
}

export async function POST(request: Request) {
  try {
    const updatedData = await request.json();
    
    // Basic validation
    if (!updatedData.products || !Array.isArray(updatedData.products)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // 1. Save locally to data/products.json first (instant < 2ms)
    try {
      await fs.writeFile(dataFilePath, JSON.stringify(updatedData, null, 2), "utf-8");
    } catch (fsError) {
      console.warn("Could not write to local products.json:", fsError);
    }

    // 2. Background sync to MongoDB (non-blocking, zero client latency)
    if (clientPromise) {
      (async () => {
        try {
          const client = await clientPromise;
          const db = client.db("apple_store");

          await db.collection("products").deleteMany({});
          
          const productsToInsert = updatedData.products.map((p: any) => {
            const { _id, ...rest } = p;
            return rest;
          });

          if (productsToInsert.length > 0) {
            await db.collection("products").insertMany(productsToInsert);
          }

          if (updatedData.categories && Array.isArray(updatedData.categories)) {
            await db.collection("categories").deleteMany({});
            const categoriesToInsert = updatedData.categories.map((c: any) => {
              const { _id, ...rest } = c;
              return rest;
            });
            if (categoriesToInsert.length > 0) {
              await db.collection("categories").insertMany(categoriesToInsert);
            }
          }
        } catch (mongoError) {
          console.warn("Background MongoDB sync for products failed:", mongoError);
        }
      })();
    }

    return NextResponse.json({ success: true, count: updatedData.products.length });
  } catch (error) {
    console.error("Failed to save products data:", error);
    return NextResponse.json({ error: "Failed to save products" }, { status: 500 });
  }
}
