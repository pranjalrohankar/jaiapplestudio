import fs from "fs/promises";
import path from "path";
import clientPromise from "@/lib/mongodb";
import fallbackData from "../../data/products.json";
import { type Product, type Category, normalizeSlug, matchProductSlug } from "@/lib/products";

const dataFilePath = path.join(process.cwd(), "data", "products.json");

export async function getAllProducts(): Promise<Product[]> {
  // 1. Prioritize MongoDB Atlas (live changes from Admin)
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");
        return await db
          .collection("products")
          .find({}, { projection: { _id: 0 } })
          .toArray();
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
      const products = await Promise.race([mongoPromise, timeoutPromise]);

      if (products && Array.isArray(products) && products.length > 0) {
        return products as unknown as Product[];
      }
    } catch (error) {
      console.warn("MongoDB fetch products failed, using local fallback:", error);
    }
  }

  // 2. Read from data/products.json as fallback
  try {
    const fileContent = await fs.readFile(dataFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      return data.products;
    }
  } catch (fileError) {
    // ignore
  }

  return (fallbackData.products as Product[]) || [];
}

export async function getAllCategories(): Promise<Category[]> {
  // 1. Prioritize MongoDB Atlas
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");
        
        // Try individual items in categories collection
        const docs = await db
          .collection("categories")
          .find({}, { projection: { _id: 0 } })
          .toArray();
        if (Array.isArray(docs) && docs.length > 0) {
          return docs;
        }

        // Try config doc in categories_config
        const configDoc = await db.collection("categories_config").findOne({}, { projection: { _id: 0 } });
        if (configDoc && Array.isArray(configDoc.categories) && configDoc.categories.length > 0) {
          return configDoc.categories;
        }

        return null;
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
      const categories = await Promise.race([mongoPromise, timeoutPromise]);

      if (categories && Array.isArray(categories) && categories.length > 0) {
        return categories as unknown as Category[];
      }
    } catch (error) {
      console.warn("MongoDB fetch categories failed, using local fallback:", error);
    }
  }

  // 2. Read from data/products.json as fallback
  try {
    const fileContent = await fs.readFile(dataFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
      return data.categories;
    }
  } catch (fileError) {
    // ignore
  }

  return (fallbackData.categories as Category[]) || [];
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!slug) return undefined;
  const products = await getAllProducts();
  return products.find((p) => matchProductSlug(p.slug, slug) || matchProductSlug(p.name, slug));
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  if (!categorySlug) return [];
  const products = await getAllProducts();
  const normCategory = normalizeSlug(categorySlug);
  return products.filter((p) => p.category === categorySlug || normalizeSlug(p.category) === normCategory);
}

export async function getCategoryBySlug(categorySlug: string): Promise<Category | undefined> {
  if (!categorySlug) return undefined;
  const categories = await getAllCategories();
  const normCategory = normalizeSlug(categorySlug);
  return categories.find((c) => c.slug === categorySlug || normalizeSlug(c.slug) === normCategory);
}
