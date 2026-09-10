import fs from "fs/promises";
import path from "path";
import clientPromise from "@/lib/mongodb";
import fallbackData from "../../data/products.json";
import { type Product, type Category, normalizeSlug, matchProductSlug } from "@/lib/products";

const dataFilePath = path.join(process.cwd(), "data", "products.json");

export async function getAllProducts(): Promise<Product[]> {
  // 1. Read from data/products.json (fastest and always up-to-date locally)
  try {
    const fileContent = await fs.readFile(dataFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      return data.products;
    }
  } catch (fileError) {
    // If file read fails, try MongoDB
  }

  // 2. Try MongoDB if available
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const products = await db.collection("products").find({}, { projection: { _id: 0 } }).toArray();
      if (products && products.length > 0) {
        return products as unknown as Product[];
      }
    } catch (error) {
      console.warn("MongoDB fetch products failed:", error);
    }
  }

  return (fallbackData.products as Product[]) || [];
}

export async function getAllCategories(): Promise<Category[]> {
  // 1. Read from data/products.json
  try {
    const fileContent = await fs.readFile(dataFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
      return data.categories;
    }
  } catch (fileError) {
    // If file read fails, try MongoDB
  }

  // 2. Try MongoDB if available
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const categories = await db.collection("categories").find({}, { projection: { _id: 0 } }).toArray();
      if (categories && categories.length > 0) {
        return categories as unknown as Category[];
      }
    } catch (error) {
      console.warn("MongoDB fetch categories failed:", error);
    }
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
