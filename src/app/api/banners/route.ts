import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/banners.json";
import { defaultOfferBanners, defaultBannersData, type BannersData, type OfferBanner } from "@/lib/banners";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bannerFilePath = path.join(process.cwd(), "data", "banners.json");

export async function GET() {
  // 1. Prioritize MongoDB Atlas (live admin updates)
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");
        return await db.collection("banners_config").findOne({}, { projection: { _id: 0 } });
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const bannerDoc = await Promise.race([mongoPromise, timeoutPromise]);

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
          source: "mongodb",
        });
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for banner:", error);
    }
  }

  // 2. Read from local data/banners.json as fallback
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
        source: "local",
      });
    }
  } catch (fileError) {
    // Continue to fallback
  }

  // 3. Bundled Fallback
  return NextResponse.json({
    banners: (fallbackData.banners as OfferBanner[]) || defaultOfferBanners,
    announcement: fallbackData.announcement || defaultBannersData.announcement,
    isAnnouncementActive: fallbackData.isAnnouncementActive ?? true,
    banner: {
      isActive: fallbackData.isAnnouncementActive ?? true,
      announcement: fallbackData.announcement || defaultBannersData.announcement,
    },
    source: "fallback",
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

    let savedToMongo = false;

    // 1. AWAIT MongoDB write
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("banners_config").deleteMany({});
          await db.collection("banners_config").insertOne({ ...dataToSave });
          return true;
        })();

        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2500));
        savedToMongo = await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("MongoDB sync for banners failed:", mongoError);
      }
    }

    // 2. Also try local file write
    try {
      await fs.writeFile(bannerFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      // ignore on read-only environments
    }

    return NextResponse.json({
      success: true,
      banners: dataToSave.banners,
      announcement: dataToSave.announcement,
      isAnnouncementActive: dataToSave.isAnnouncementActive,
      savedToMongo,
    });
  } catch (error: any) {
    console.error("Banner save error:", error);
    return NextResponse.json({ error: error.message || "Failed to save banner settings" }, { status: 500 });
  }
}
