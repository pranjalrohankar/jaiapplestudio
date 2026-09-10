import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/categories.json";
import { defaultCategoryTiles, type CategoriesData, type CategoryTile } from "@/lib/categories";

const categoriesFilePath = path.join(process.cwd(), "data", "categories.json");

export async function GET() {
  // 1. Try local file first (fastest)
  try {
    const fileContent = await fs.readFile(categoriesFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && Array.isArray(data.categories)) {
      return NextResponse.json({
        categories: data.categories,
      });
    }
  } catch (fileError) {
    // Continue to MongoDB
  }

  // 2. Try MongoDB
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const categoriesDoc = await db.collection("categories_config").findOne({}, { projection: { _id: 0 } });
      if (categoriesDoc && Array.isArray(categoriesDoc.categories)) {
        return NextResponse.json({
          categories: categoriesDoc.categories,
        });
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for categories:", error);
    }
  }

  // 3. Fallback
  return NextResponse.json({
    categories: (fallbackData.categories as CategoryTile[]) || defaultCategoryTiles,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const categories: CategoryTile[] = Array.isArray(body.categories) ? body.categories : defaultCategoryTiles;

    const dataToSave: CategoriesData = {
      categories,
    };

    // 1. Save locally to data/categories.json first (instant < 2ms)
    try {
      await fs.writeFile(categoriesFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      console.warn("Could not save categories to local file:", fsError);
    }

    // 2. Background sync to MongoDB (non-blocking, zero client latency)
    if (clientPromise) {
      (async () => {
        try {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("categories_config").deleteMany({});
          await db.collection("categories_config").insertOne({ ...dataToSave });
        } catch (mongoError) {
          console.warn("Background MongoDB sync for categories failed:", mongoError);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      categories: dataToSave.categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save categories" }, { status: 500 });
  }
}
