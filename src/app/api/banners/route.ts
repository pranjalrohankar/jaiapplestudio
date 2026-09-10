import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/banners.json";
import { defaultOfferBanners, defaultBannersData, type BannersData, type OfferBanner } from "@/lib/banners";

const bannerFilePath = path.join(process.cwd(), "data", "banners.json");

export async function GET() {
  // 1. Try local file first (fastest)
  try {
    const fileContent = await fs.readFile(bannerFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && (Array.isArray(data.banners) || data.announcement)) {
      const banners = Array.isArray(data.banners) ? data.banners : defaultOfferBanners;
      const announcement = data.announcement || defaultBannersData.announcement;
      const isAnnouncementActive = data.isAnnouncementActive ?? true;
      return NextResponse.json({
        banners,
        announcement,
        isAnnouncementActive,
        banner: {
          isActive: isAnnouncementActive,
          announcement,
        },
      });
    }
  } catch (fileError) {
    // Continue to MongoDB
  }

  // 2. Try to fetch from MongoDB if available
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const bannerDoc = await db.collection("banners_config").findOne({}, { projection: { _id: 0 } });
      if (bannerDoc && (Array.isArray(bannerDoc.banners) || bannerDoc.announcement)) {
        const announcement = bannerDoc.announcement || defaultBannersData.announcement;
        const isAnnouncementActive = bannerDoc.isAnnouncementActive ?? true;
        return NextResponse.json({
          banners: bannerDoc.banners || defaultOfferBanners,
          announcement,
          isAnnouncementActive,
          banner: {
            isActive: isAnnouncementActive,
            announcement,
          },
        });
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for banner:", error);
    }
  }

  // 3. Fallback
  return NextResponse.json({
    banners: (fallbackData.banners as OfferBanner[]) || defaultOfferBanners,
    announcement: fallbackData.announcement || defaultBannersData.announcement,
    isAnnouncementActive: fallbackData.isAnnouncementActive ?? true,
    banner: {
      isActive: fallbackData.isAnnouncementActive ?? true,
      announcement: fallbackData.announcement || defaultBannersData.announcement,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Normalize data structure
    const banners: OfferBanner[] = Array.isArray(body.banners)
      ? body.banners
      : defaultOfferBanners;

    const announcement = body.announcement ?? defaultBannersData.announcement;
    const isAnnouncementActive = body.isAnnouncementActive ?? true;

    const dataToSave: BannersData = {
      announcement,
      isAnnouncementActive,
      banners,
    };

    // 1. Save locally to data/banners.json first (instant < 2ms)
    try {
      await fs.writeFile(bannerFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      console.warn("Could not save banner config to local file:", fsError);
    }

    // 2. Background sync to MongoDB (non-blocking, zero client latency)
    if (clientPromise) {
      (async () => {
        try {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("banners_config").deleteMany({});
          await db.collection("banners_config").insertOne({ ...dataToSave });
        } catch (mongoError) {
          console.warn("Background MongoDB sync for banners failed:", mongoError);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      banners: dataToSave.banners,
      announcement: dataToSave.announcement,
      isAnnouncementActive: dataToSave.isAnnouncementActive,
    });
  } catch (error: any) {
    console.error("Banner save error:", error);
    return NextResponse.json({ error: error.message || "Failed to save banner settings" }, { status: 500 });
  }
}
