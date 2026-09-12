import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize file extension and name
    const ext = (path.extname(file.name) || ".png").toLowerCase();
    const base = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 30);
    const filename = `${Date.now()}-${base || "image"}${ext}`;

    const mimeType =
      file.type ||
      (ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
        ? "image/webp"
        : ext === ".svg"
        ? "image/svg+xml"
        : "image/png");

    const base64Url = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // 1. In local development or writable environments, try saving to public/uploads
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);

      return NextResponse.json({
        url: `/uploads/${filename}`,
        name: filename,
        success: true,
      });
    } catch (fsErr) {
      // 2. In serverless / read-only environments (Netlify / Vercel), return the Base64 Data URL directly!
      // This is 100% compatible with Next.js Image, browsers, and persists straight into MongoDB Atlas!
      return NextResponse.json({
        url: base64Url,
        name: filename,
        success: true,
      });
    }
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
