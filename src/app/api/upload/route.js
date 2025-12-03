import { writeFile, mkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Magic bytes signatures for file validation
const FILE_SIGNATURES = {
  "image/jpeg": [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  "image/png": [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50], // WEBP (null = any byte)
  ],
};

// Validate file content by checking magic bytes
function validateFileSignature(buffer, mimeType) {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return false;

  const fileHeader = new Uint8Array(buffer.slice(0, 12)); // Read first 12 bytes

  return signatures.some((signature) => {
    return signature.every((byte, index) => {
      return byte === null || fileHeader[index] === byte;
    });
  });
}

// Generate secure filename
function generateSecureFilename(mimeType) {
  const randomName = randomBytes(16).toString("hex");
  const extensionMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = extensionMap[mimeType] || "jpg";
  return `${randomName}.${extension}`;
}

// Sanitize original filename for storage/display
function sanitizeFilename(filename) {
  let sanitized = filename.replace(/[\/\\]/g, "");
  sanitized = sanitized.replace(/\0/g, "");
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  sanitized = sanitized.replace(/^\.+/, "");

  if (sanitized.length > 200) {
    const ext = path.extname(sanitized);
    sanitized = sanitized.substring(0, 200 - ext.length) + ext;
  }

  return sanitized || "unnamed";
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const productId = formData.get("productId");

    // Basic validation
    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json(
        { error: "No productId provided." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        },
        { status: 415 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `File too large (${sizeMB}MB). Maximum file size is ${
            MAX_SIZE / (1024 * 1024)
          }MB.`,
        },
        { status: 413 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file content by checking magic bytes
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        {
          error:
            "File content doesn't match declared type. Possible file corruption or security threat.",
        },
        { status: 415 }
      );
    }

    // Create upload directory
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "images",
      "products_images"
    );
    await mkdir(uploadDir, { recursive: true });

    // Generate secure filename
    const secureFilename = generateSecureFilename(file.type);
    const filePath = path.join(uploadDir, secureFilename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Sanitize original filename for reference
    const originalFilename = sanitizeFilename(file.name);

    return NextResponse.json({
      url: `/images/products_images/${secureFilename}`,
      filename: secureFilename,
      originalName: originalFilename,
      mimeType: file.type,
      size: file.size,
      message: "File uploaded successfully!",
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Error uploading file." },
      { status: 500 }
    );
  }
}
