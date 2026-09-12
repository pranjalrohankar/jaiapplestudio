import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/social.json";
import { defaultSocialLinks, type SocialData, type SocialLink } from "@/lib/social";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const socialFilePath = path.join(process.cwd(), "data", "social.json");

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  // 1. Prioritize MongoDB Atlas (live admin updates)
  if (clientPromise) {
    try {
      const mongoPromise = (async () => {
        const client = await clientPromise;
        const db = client.db("apple_store");

        // Try social_links first
        const doc = await db.collection("social_links").findOne({}, { projection: { _id: 0 } });
        if (doc && Array.isArray(doc.socialLinks) && doc.socialLinks.length > 0) {
          return doc.socialLinks;
        }

        // Try social_config
        const configDoc = await db.collection("social_config").findOne({}, { projection: { _id: 0 } });
        if (configDoc && Array.isArray(configDoc.socialLinks) && configDoc.socialLinks.length > 0) {
          return configDoc.socialLinks;
        }

        return null;
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
      const socialLinks = await Promise.race([mongoPromise, timeoutPromise]);

      if (socialLinks && Array.isArray(socialLinks) && socialLinks.length > 0) {
        return NextResponse.json(
          {
            socialLinks,
            source: "mongodb",
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for social links:", error);
    }
  }

  // 2. Read from local data/social.json as fallback
  try {
    const fileContent = await fs.readFile(socialFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && Array.isArray(data.socialLinks) && data.socialLinks.length > 0) {
      return NextResponse.json(
        {
          socialLinks: data.socialLinks,
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
      socialLinks: (fallbackData.socialLinks as SocialLink[]) || defaultSocialLinks,
      source: "fallback",
    },
    { headers: NO_CACHE_HEADERS }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const socialLinks: SocialLink[] = Array.isArray(body.socialLinks) ? body.socialLinks : defaultSocialLinks;

    const dataToSave: SocialData = {
      socialLinks,
    };

    let savedToMongo = false;

    // 1. AWAIT MongoDB write
    if (clientPromise) {
      try {
        const syncPromise = (async () => {
          const client = await clientPromise;
          const db = client.db("apple_store");

          // Sync to both social_links and social_config
          await db.collection("social_links").deleteMany({});
          await db.collection("social_links").insertOne({ ...dataToSave });

          await db.collection("social_config").deleteMany({});
          await db.collection("social_config").insertOne({ ...dataToSave });

          return true;
        })();

        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000));
        savedToMongo = await Promise.race([syncPromise, timeoutPromise]);
      } catch (mongoError) {
        console.warn("MongoDB sync for social links failed:", mongoError);
      }
    }

    // 2. Also try local file write
    try {
      await fs.writeFile(socialFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      // ignore on read-only environments
    }

    return NextResponse.json(
      {
        success: true,
        socialLinks: dataToSave.socialLinks,
        savedToMongo,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save social links" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
