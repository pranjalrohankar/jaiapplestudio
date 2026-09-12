import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/categories.json";
import { defaultCategoryTiles, type CategoriesData, type CategoryTile } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const categoriesFilePath = path.join(process.cwd(), "data", "categories.json");

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  // 1. Prioritize MongoDB Atlas (live admin updates)
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");

        // Try individual documents in 'categories' collection first
        const docs = await db.collection("categories").find({}, { projection: { _id: 0 } }).toArray();
        if (Array.isArray(docs) && docs.length > 0) {
          // If docs is array of CategoryTile
          return docs;
        }

        // Try config doc in 'categories_config'
        const configDoc = await db.collection("categories_config").findOne({}, { projection: { _id: 0 } });
        if (configDoc && Array.isArray(configDoc.categories) && configDoc.categories.length > 0) {
          return configDoc.categories;
        }

        return null;
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
      const categories = await Promise.race([mongoPromise, timeoutPromise]);

      if (categories && Array.isArray(categories) && categories.length > 0) {
        return NextResponse.json(
          {
            categories,
            source: "mongodb",
          },
          { headers: NO_CACHE_HEADERS }
        );
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
      return NextResponse.json(
        {
          categories: data.categories,
          source: "local",
        },
        { headers: NO_CACHE_HEADERS }
      );
    }
  } catch (fileError) {
    // Continue to fallback
  }

  // 3. Bundled Fallback
  return NextResponse.json(
    {
      categories: (fallbackData.categories as CategoryTile[]) || defaultCategoryTiles,
      source: "fallback",
    },
    { headers: NO_CACHE_HEADERS }
  );
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

          const cleanCategories = categories.map((c: any) => {
            const { _id, ...rest } = c;
            return rest;
          });

          // Sync to 'categories' collection (array of items)
          await db.collection("categories").deleteMany({});
          if (cleanCategories.length > 0) {
            await db.collection("categories").insertMany(cleanCategories);
          }

          // Also sync to 'categories_config' collection (single doc with { categories })
          await db.collection("categories_config").deleteMany({});
          await db.collection("categories_config").insertOne({ categories: cleanCategories });

          return true;
        })();

        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000));
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

    return NextResponse.json(
      {
        success: true,
        categories: dataToSave.categories,
        savedToMongo,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save categories" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
