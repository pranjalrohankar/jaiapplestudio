import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/banners.json";
import { defaultOfferBanners, defaultBannersData, type BannersData, type OfferBanner } from "@/lib/banners";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bannerFilePath = path.join(process.cwd(), "data", "banners.json");

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  // 1. Prioritize MongoDB Atlas (live database source of truth)
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");

      const [bannerDoc, legacyDoc] = await Promise.all([
        db.collection("banners_config").findOne({}, { projection: { _id: 0 } }).catch(() => null),
        db.collection("banners").findOne({}, { projection: { _id: 0 } }).catch(() => null),
      ]);

      const doc = bannerDoc || legacyDoc;
      if (doc && (Array.isArray(doc.banners) || doc.announcement)) {
        const announcement = doc.announcement || "";
        const isAnnouncementActive = doc.isAnnouncementActive ?? true;
        const banners = Array.isArray(doc.banners) ? doc.banners : [];

        return NextResponse.json(
          {
            banners,
            announcement,
            isAnnouncementActive,
            banner: {
              isActive: isAnnouncementActive,
              announcement,
            },
            source: "mongodb",
          },
          { headers: NO_CACHE_HEADERS }
        );
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
      const banners = Array.isArray(data.banners) ? data.banners : [];
      const announcement = data.announcement || "";
      const isAnnouncementActive = data.isAnnouncementActive ?? true;
      return NextResponse.json(
        {
          banners,
          announcement,
          isAnnouncementActive,
          banner: {
            isActive: isAnnouncementActive,
            announcement,
          },
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
      banners: (fallbackData.banners as OfferBanner[]) || [],
      announcement: fallbackData.announcement || "",
      isAnnouncementActive: fallbackData.isAnnouncementActive ?? true,
      banner: {
        isActive: fallbackData.isAnnouncementActive ?? true,
        announcement: fallbackData.announcement || "",
      },
      source: "fallback",
    },
    { headers: NO_CACHE_HEADERS }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Normalize data structure
    const banners: OfferBanner[] = Array.isArray(body.banners) ? body.banners : [];
    const announcement = body.announcement ?? "";
    const isAnnouncementActive = body.isAnnouncementActive ?? true;

    const dataToSave: BannersData = {
      announcement,
      isAnnouncementActive,
      banners,
    };

    let savedToMongo = false;

    // 1. Direct MongoDB atomic upsert (never leave empty)
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");

        await Promise.all([
          db.collection("banners_config").updateOne({}, { $set: dataToSave }, { upsert: true }),
          db.collection("banners").updateOne({}, { $set: dataToSave }, { upsert: true }),
        ]);

        savedToMongo = true;
      } catch (mongoError) {
        console.warn("MongoDB sync for banners failed:", mongoError);
      }
    }

    // 2. Also save to local file backup
    try {
      await fs.writeFile(bannerFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      // ignore on read-only environments
    }

    return NextResponse.json(
      {
        success: true,
        banners: dataToSave.banners,
        announcement: dataToSave.announcement,
        isAnnouncementActive: dataToSave.isAnnouncementActive,
        savedToMongo,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("Banner save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save banner settings" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
