import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/slider.json";
import { defaultSliderSlides, type SliderData, type SliderSlide } from "@/lib/slider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const sliderFilePath = path.join(process.cwd(), "data", "slider.json");

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
      const sliderDoc = await db.collection("slider_config").findOne({}, { projection: { _id: 0 } });

      if (sliderDoc && Array.isArray(sliderDoc.slides)) {
        return NextResponse.json(
          {
            slides: sliderDoc.slides,
            source: "mongodb",
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for slider:", error);
    }
  }

  // 2. Read from local data/slider.json as fallback
  try {
    const fileContent = await fs.readFile(sliderFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && Array.isArray(data.slides)) {
      return NextResponse.json(
        {
          slides: data.slides,
          source: "local",
        },
        { headers: NO_CACHE_HEADERS }
      );
    }
  } catch (fileError) {
    // Continue to fallback
  }

  // 3. Bundled Fallback (only if no DB/file doc exists at all)
  return NextResponse.json(
    {
      slides: (fallbackData.slides as SliderSlide[]) || [],
      source: "fallback",
    },
    { headers: NO_CACHE_HEADERS }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slides: SliderSlide[] = Array.isArray(body.slides) ? body.slides : [];

    const dataToSave: SliderData = {
      slides,
    };

    let savedToMongo = false;

    // 1. Atomic MongoDB write (never delete before insert)
    if (clientPromise) {
      try {
        const client = await clientPromise;
        const db = client.db("apple_store");
        await db.collection("slider_config").updateOne({}, { $set: dataToSave }, { upsert: true });
        savedToMongo = true;
      } catch (mongoError) {
        console.warn("MongoDB sync for slider failed:", mongoError);
      }
    }

    // 2. Also save to local file backup
    try {
      await fs.writeFile(sliderFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      // ignore on read-only environments
    }

    return NextResponse.json(
      {
        success: true,
        slides: dataToSave.slides,
        savedToMongo,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save slider" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
