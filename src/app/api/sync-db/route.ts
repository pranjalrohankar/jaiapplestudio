import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

async function readJsonFile(filename: string, fallback: any = {}) {
  try {
    const content = await fs.readFile(path.join(dataDir, filename), "utf-8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db("apple_store");

    const productsCount = await db.collection("products").countDocuments();
    const categoriesCount = await db.collection("categories").countDocuments();
    const sliderDoc = await db.collection("slider_config").findOne({});
    const bannerDoc = await db.collection("banners_config").findOne({});
    const ordersCount = await db.collection("orders").countDocuments();
    const enquiriesCount = await db.collection("enquiries").countDocuments();
    const socialDoc = await db.collection("social_links").findOne({});

    const slidesCount = Array.isArray(sliderDoc?.slides) ? sliderDoc.slides.length : 0;
    const bannersCount = Array.isArray(bannerDoc?.banners) ? bannerDoc.banners.length : 0;
    const socialLinksCount = Array.isArray(socialDoc?.socialLinks) ? socialDoc.socialLinks.length : 0;

    return NextResponse.json({
      connected: true,
      database: "apple_store",
      counts: {
        products: productsCount,
        categories: categoriesCount,
        slides: slidesCount,
        banners: bannersCount,
        orders: ordersCount,
        enquiries: enquiriesCount,
        socialLinks: socialLinksCount,
        totalDocuments:
          productsCount +
          categoriesCount +
          (sliderDoc ? 1 : 0) +
          (bannerDoc ? 1 : 0) +
          ordersCount +
          enquiriesCount +
          (socialDoc ? 1 : 0),
      },
    });
  } catch (err: any) {
    const errMsg = err?.message || "Unknown error";
    const isIpBlocked = errMsg.includes("SSL alert number 80") || errMsg.includes("tlsv1 alert internal error") || errMsg.includes("timed out") || errMsg.includes("paused");

    return NextResponse.json(
      {
        connected: false,
        error: errMsg,
        ipBlockDetected: isIpBlocked,
        troubleshooting: isIpBlocked
          ? "MongoDB Atlas IP Whitelist is blocking connections. In MongoDB Atlas, go to Network Access -> Add IP Address -> Select 'Allow Access from Anywhere' (0.0.0.0/0)."
          : "Check your MONGODB_URI connection string in .env.local.",
      },
      { status: 200 }
    );
  }
}

export async function POST() {
  try {
    const client = await getMongoClient();
    const db = client.db("apple_store");

    // 1. Read all local data
    const productsData = await readJsonFile("products.json", { products: [], categories: [] });
    const sliderData = await readJsonFile("slider.json", { slides: [] });
    const bannersData = await readJsonFile("banners.json", { banners: [], announcement: "" });
    const categoriesData = await readJsonFile("categories.json", { categories: [] });
    const ordersData = await readJsonFile("orders.json", { orders: [] });
    const enquiriesData = await readJsonFile("enquiries.json", { enquiries: [] });
    const socialData = await readJsonFile("social.json", { socialLinks: [] });

    const results: Record<string, number> = {};

    // 2. Sync Products
    const productsList = Array.isArray(productsData.products) ? productsData.products : [];
    if (productsList.length > 0) {
      await db.collection("products").deleteMany({});
      const cleanProducts = productsList.map((p: any) => {
        const { _id, ...rest } = p;
        return rest;
      });
      await db.collection("products").insertMany(cleanProducts);
      results.products = cleanProducts.length;
    }

    // 3. Sync Categories
    const categoriesList =
      Array.isArray(categoriesData.categories) && categoriesData.categories.length > 0
        ? categoriesData.categories
        : Array.isArray(productsData.categories)
        ? productsData.categories
        : [];
    if (categoriesList.length > 0) {
      await db.collection("categories").deleteMany({});
      const cleanCategories = categoriesList.map((c: any) => {
        const { _id, ...rest } = c;
        return rest;
      });
      await db.collection("categories").insertMany(cleanCategories);
      results.categories = cleanCategories.length;
    }

    // 4. Sync Slider Configuration
    if (sliderData) {
      await db.collection("slider_config").deleteMany({});
      const { _id, ...cleanSlider } = sliderData;
      await db.collection("slider_config").insertOne(cleanSlider);
      results.slides = Array.isArray(sliderData.slides) ? sliderData.slides.length : 1;
    }

    // 5. Sync Banners Configuration
    if (bannersData) {
      await db.collection("banners_config").deleteMany({});
      const { _id, ...cleanBanners } = bannersData;
      await db.collection("banners_config").insertOne(cleanBanners);
      results.banners = Array.isArray(bannersData.banners) ? bannersData.banners.length : 1;
    }

    // 6. Sync Orders
    const ordersList = Array.isArray(ordersData.orders) ? ordersData.orders : [];
    if (ordersList.length > 0) {
      await db.collection("orders").deleteMany({});
      const cleanOrders = ordersList.map((o: any) => {
        const { _id, ...rest } = o;
        return rest;
      });
      await db.collection("orders").insertMany(cleanOrders);
      results.orders = cleanOrders.length;
    }

    // 7. Sync Enquiries
    const enquiriesList = Array.isArray(enquiriesData.enquiries) ? enquiriesData.enquiries : [];
    if (enquiriesList.length > 0) {
      await db.collection("enquiries").deleteMany({});
      const cleanEnquiries = enquiriesList.map((e: any) => {
        const { _id, ...rest } = e;
        return rest;
      });
      await db.collection("enquiries").insertMany(cleanEnquiries);
      results.enquiries = cleanEnquiries.length;
    }

    // 8. Sync Social Links
    if (socialData) {
      await db.collection("social_links").deleteMany({});
      const { _id, ...cleanSocial } = socialData;
      await db.collection("social_links").insertOne(cleanSocial);
      results.socialLinks = Array.isArray(socialData.socialLinks) ? socialData.socialLinks.length : 1;
    }

    return NextResponse.json({
      success: true,
      message: "Successfully synchronized all local data into MongoDB Atlas database!",
      syncedCounts: results,
    });
  } catch (err: any) {
    console.error("Database sync failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Database synchronization failed",
        hint: "Ensure MongoDB Atlas Network Access has IP 0.0.0.0/0 allowed.",
      },
      { status: 500 }
    );
  }
}
