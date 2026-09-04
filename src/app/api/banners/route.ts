import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackBannerData from "../../../../data/banners.json";

const bannerFilePath = path.join(process.cwd(), "data", "banners.json");

export async function GET() {
  // 1. Try to fetch from MongoDB if available
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const bannerDoc = await db.collection("banners").findOne({}, { projection: { _id: 0 } });
      if (bannerDoc) {
        return NextResponse.json({ banner: bannerDoc });
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for banner, falling back to local banners.json:", error);
    }
  }

  // 2. Fallback to local data/banners.json
  try {
    const fileContent = await fs.readFile(bannerFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    return NextResponse.json({ banner: data.banner || fallbackBannerData.banner });
  } catch (fileError) {
    console.warn("Reading data/banners.json failed, using imported fallback:", fileError);
    return NextResponse.json({ banner: fallbackBannerData.banner });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bannerData = body.banner || body;

    if (!bannerData || typeof bannerData !== "object") {
      return NextResponse.json({ error: "Invalid banner data" }, { status: 400 });
    }

    let savedToMongo = false;

    // Attempt to save to MongoDB
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");

        await db.collection("banners").deleteMany({});
        const { _id, ...cleanBanner } = bannerData;
        await db.collection("banners").insertOne(cleanBanner);
        savedToMongo = true;
      } catch (mongoError) {
        console.warn("Could not save banner to MongoDB, saving locally:", mongoError);
      }
    }

    // Always keep data/banners.json updated locally
    try {
      await fs.writeFile(
        bannerFilePath,
        JSON.stringify({ banner: bannerData }, null, 2),
        "utf-8"
      );
    } catch (fsError) {
      console.warn("Could not write to local banners.json:", fsError);
    }

    return NextResponse.json({ success: true, savedToMongo, banner: bannerData });
  } catch (error) {
    console.error("Failed to save banner data:", error);
    return NextResponse.json({ error: "Failed to save banner" }, { status: 500 });
  }
}
