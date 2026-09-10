import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import fallbackData from "../../../../data/slider.json";
import { defaultSliderSlides, type SliderData, type SliderSlide } from "@/lib/slider";

const sliderFilePath = path.join(process.cwd(), "data", "slider.json");

export async function GET() {
  // 1. Try local file first (fastest)
  try {
    const fileContent = await fs.readFile(sliderFilePath, "utf-8");
    const data = JSON.parse(fileContent);
    if (data && Array.isArray(data.slides)) {
      return NextResponse.json({
        slides: data.slides,
      });
    }
  } catch (fileError) {
    // Continue to MongoDB
  }

  // 2. Try MongoDB
  if (clientPromise) {
    try {
      const client = await clientPromise;
      const db = client.db("apple_store");
      const sliderDoc = await db.collection("slider_config").findOne({}, { projection: { _id: 0 } });
      if (sliderDoc && Array.isArray(sliderDoc.slides)) {
        return NextResponse.json({
          slides: sliderDoc.slides,
        });
      }
    } catch (error) {
      console.warn("MongoDB fetch failed for slider:", error);
    }
  }

  // 3. Fallback
  return NextResponse.json({
    slides: (fallbackData.slides as SliderSlide[]) || defaultSliderSlides,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slides: SliderSlide[] = Array.isArray(body.slides) ? body.slides : defaultSliderSlides;

    const dataToSave: SliderData = {
      slides,
    };

    // 1. Save locally to data/slider.json first (instant < 2ms)
    try {
      await fs.writeFile(sliderFilePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (fsError) {
      console.warn("Could not save slider to local file:", fsError);
    }

    // 2. Background sync to MongoDB (non-blocking, zero client latency)
    if (clientPromise) {
      (async () => {
        try {
          const client = await clientPromise;
          const db = client.db("apple_store");
          await db.collection("slider_config").deleteMany({});
          await db.collection("slider_config").insertOne({ ...dataToSave });
        } catch (mongoError) {
          console.warn("Background MongoDB sync for slider failed:", mongoError);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      slides: dataToSave.slides,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save slider" }, { status: 500 });
  }
}
