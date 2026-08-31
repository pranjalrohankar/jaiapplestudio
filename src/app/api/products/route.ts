import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("apple_store");
    
    // Fetch products and categories, excluding the MongoDB _id field to match the old JSON structure
    const categories = await db.collection("categories").find({}, { projection: { _id: 0 } }).toArray();
    const products = await db.collection("products").find({}, { projection: { _id: 0 } }).toArray();

    return NextResponse.json({ categories, products });
  } catch (error) {
    console.error("Failed to read products data from MongoDB", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updatedData = await request.json();
    
    // Basic validation
    if (!updatedData.products) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("apple_store");

    // Since the frontend sends the full array, we replace the whole collection
    // In a production app, you'd typically have specific endpoints for PUT / DELETE on individual products
    await db.collection("products").deleteMany({});
    
    // Clean up _id fields just in case they snuck through
    const productsToInsert = updatedData.products.map((p: any) => {
      const { _id, ...rest } = p;
      return rest;
    });

    if (productsToInsert.length > 0) {
      await db.collection("products").insertMany(productsToInsert);
    }

    // Also update categories if provided
    if (updatedData.categories) {
       await db.collection("categories").deleteMany({});
       const categoriesToInsert = updatedData.categories.map((c: any) => {
         const { _id, ...rest } = c;
         return rest;
       });
       if (categoriesToInsert.length > 0) {
         await db.collection("categories").insertMany(categoriesToInsert);
       }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save products data to MongoDB", error);
    return NextResponse.json({ error: "Failed to save products" }, { status: 500 });
  }
}
