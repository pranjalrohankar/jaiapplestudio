import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/categories.json";
import { defaultCategoryTiles, type CategoriesData, type CategoryTile } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const categoriesFilePath = path.join(process.cwd(), "data", "categories.json");

export async function GET() {
  // 1. Prioritize MongoDB Atlas (live admin updates)
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");
        return await db.collection("categories_config").findOne({}, { projection: { _id: 0 } });
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const categoriesDoc = await Promise.race([mongoPromise, timeoutPromise]);

      if (categoriesDoc && Array.isArray(categoriesDoc.categories) && categoriesDoc.categories.length > 0) {
        return NextResponse.json({
          categories: categoriesDoc.categories,
          source: "mongodb",
        });
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for categories:", error);
    }
  }

  // 2. Read from local data/categories.json as fallback
  try {
    const fileContent = await fs.readFile(categoriesFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && Array.isArray(data.categories) && data.categories.length > 0) {
      return NextResponse.json({
        categories: data.categories,
        source: "local",
      });
    }
  } catch (fileError) {
    // Continue to fallback
  }

  // 3. Bundled Fallback
  return NextResponse.json({
    categories: (fallbackData.categories as CategoryTile[]) || defaultCategoryTiles,
    source: "fallback",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const categories: CategoryTile[] = Array.isArray(body.categories) ? body.categories : defaultCategoryTiles;

    const dataToSave: CategoriesData = {
      categories,
    };

    let savedToMongo = false;

    // 1. AWAIT MongoDB write
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("categories_config").deleteMany({});
          await db.collection("categories_config").insertOne({ ...dataToSave });
          return true;
        })();

        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2500));
        savedToMongo = await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("MongoDB sync for categories failed:", mongoError);
      }
    }

    // 2. Also try local file write
    try {
      await fs.writeFile(categoriesFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      // ignore on read-only environments
    }

    return NextResponse.json({
      success: true,
      categories: dataToSave.categories,
      savedToMongo,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save categories" }, { status: 500 });
  }
}
