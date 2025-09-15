import { writeFile, mkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function getExtension(filename) {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.slice(lastDot) : "";
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const productId = formData.get("productId");

    if (!file)
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    if (!productId)
      return NextResponse.json(
        { error: "No productId provided." },
        { status: 400 }
      );

    // --- Security checks START ---
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type." },
        { status: 415 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large." }, { status: 413 });
    }
    // --- Security checks END ---

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "images",
      "products_images"
    );
    await mkdir(uploadDir, { recursive: true });

    const ext = getExtension(file.name);
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    const newFileName = `${productId}_${timestamp}${ext}`;
    const filePath = path.join(uploadDir, newFileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/images/products_images/${newFileName}`,
      message: "File uploaded successfully!",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Error uploading file." },
      { status: 500 }
    );
  }
}
