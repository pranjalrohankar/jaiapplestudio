import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/social.json";
import { defaultSocialLinks, type SocialData, type SocialLink } from "@/lib/social";

const socialFilePath = path.join(process.cwd(), "data", "social.json");

export async function GET() {
  // 1. Try local file first (fastest, < 2ms)
  try {
    const fileContent = await fs.readFile(socialFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && Array.isArray(data.socialLinks)) {
      return NextResponse.json({
        socialLinks: data.socialLinks,
      });
    }
  } catch (fileError) {
    // Continue to MongoDB / fallback
  }

  // 2. Try MongoDB if local file read fails
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const doc = await db.collection("social_config").findOne({}, { projection: { _id: 0 } });
      if (doc && Array.isArray(doc.socialLinks)) {
        return NextResponse.json({
          socialLinks: doc.socialLinks,
        });
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for social links:", error);
    }
  }

  // 3. Fallback
  return NextResponse.json({
    socialLinks: (fallbackData.socialLinks as SocialLink[]) || defaultSocialLinks,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const socialLinks: SocialLink[] = Array.isArray(body.socialLinks) ? body.socialLinks : defaultSocialLinks;

    const dataToSave: SocialData = {
      socialLinks,
    };

    // 1. Save locally to data/social.json first (instant < 2ms)
    try {
      await fs.writeFile(socialFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      console.warn("Could not save social links to local file:", fsError);
    }

    // 2. Background sync to MongoDB (non-blocking, zero client latency)
    if (clientPromise) {
      (async () => {
        try {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("social_config").deleteMany({});
          await db.collection("social_config").insertOne({ ...dataToSave });
        } catch (mongoError) {
          console.warn("Background MongoDB sync for social links failed:", mongoError);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      socialLinks: dataToSave.socialLinks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save social links" }, { status: 500 });
  }
}
