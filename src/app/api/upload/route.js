import { writeFile, mkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file)
      return NextResponse.json({ error: "No file received." }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, file.name);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${file.name}`,
      message: "File uploaded successfully!",
    });
  } catch {
    return NextResponse.json(
      { error: "Error uploading file." },
      { status: 500 }
    );
  }
}
