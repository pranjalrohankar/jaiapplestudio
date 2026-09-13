import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/products.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dataFilePath = path.join(process.cwd(), "data", "products.json");

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  // 1. Try MongoDB Atlas first (live database products)
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const [categories, products] = await Promise.all([
        db.collection("categories").find({}, { projection: { _id: 0 } }).toArray().catch(() => []),
        db.collection("products").find({}, { projection: { _id: 0 } }).toArray().catch(() => []),
      ]);

      if (products.length > 0 || categories.length > 0) {
        return NextResponse.json(
          {
            categories: categories.length > 0 ? categories : fallbackData.categories || [],
            products: products.length > 0 ? products : fallbackData.products || [],
            source: "mongodb",
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    } catch (error) {
      console.warn("MongoDB fetch failed, using fallback:", error);
    }
  }

  // 2. Read from local data/products.json as fallback
  try {
    const fileContent = await fs.readFile(dataFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && (Array.isArray(data.products) || Array.isArray(data.categories))) {
      return NextResponse.json(
        {
          categories: data.categories || fallbackData.categories || [],
          products: data.products || fallbackData.products || [],
          source: "local",
        },
        { headers: NO_CACHE_HEADERS }
      );
    }
  } catch (fileError) {
    // Continue to fallbackData
  }

  // 3. Fallback to bundled data
  return NextResponse.json(
    {
      categories: fallbackData.categories || [],
      products: fallbackData.products || [],
      source: "fallback",
    },
    { headers: NO_CACHE_HEADERS }
  );
}

export async function POST(request: Request) {
  try {
    const updatedData = await request.json();

    // Basic validation
    if (!updatedData.products || !Array.isArray(updatedData.products)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    let savedToMongo = false;

    // 1. Direct MongoDB atomic sync (never leave collection empty)
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");

        const validSlugs: string[] = [];
        const bulkOps = updatedData.products.map((p: any) => {
          const { _id, ...rest } = p;
          if (rest.slug) validSlugs.push(rest.slug);
          return {
            updateOne: {
              filter: { slug: rest.slug },
              update: { $set: rest },
              upsert: true,
            },
          };
        });

        if (bulkOps.length > 0) {
          await db.collection("products").bulkWrite(bulkOps);
          if (validSlugs.length > 0) {
            await db.collection("products").deleteMany({ slug: { $nin: validSlugs } });
          }
        }

        if (updatedData.categories && Array.isArray(updatedData.categories)) {
          const cleanCategories = updatedData.categories.map((c: any) => {
            const { _id, ...rest } = c;
            return rest;
          });

          const validCategorySlugs: string[] = [];
          const catBulkOps = cleanCategories.map((cat: any) => {
            if (cat.slug) validCategorySlugs.push(cat.slug);
            return {
              updateOne: {
                filter: { slug: cat.slug },
                update: { $set: cat },
                upsert: true,
              },
            };
          });

          if (catBulkOps.length > 0) {
            await db.collection("categories").bulkWrite(catBulkOps);
            if (validCategorySlugs.length > 0) {
              await db.collection("categories").deleteMany({ slug: { $nin: validCategorySlugs } });
            }
          }

          // Also keep categories_config in sync atomically
          await db.collection("categories_config").updateOne(
            {},
            { $set: { categories: cleanCategories } },
            { upsert: true }
          );
        }
        savedToMongo = true;
      } catch (mongoError) {
        console.warn("MongoDB sync failed:", mongoError);
      }
    }

    // 2. Also try local file write for local development backup
    try {
      await fs.writeFile(dataFilePath, JSON.stringify(updatedData, null, 2), "utf-8");
    } catch (fsError) {
      // ignore on read-only environments
    }

    return NextResponse.json(
      {
        success: true,
        count: updatedData.products.length,
        savedToMongo,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("Failed to save products data:", error);
    return NextResponse.json({ error: "Failed to save products" }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
