import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { removeMimeBase64 } from "../utils/validade.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const currentDir = __dirname;
const parentDir = path.resolve(currentDir, "../../");
const UPLOAD_DIR = path.join(parentDir, "uploads");

export class ImageService {
  static async create(guid: string, imageUrl: string, measure_id: string) {
    return await prisma.images.create({
      data: {
        guid: guid,
        image_url: imageUrl,
        measure_id,
      },
    });
  }

  static async saveImage(
    imageBase64: string,
    fileName: string
  ): Promise<string> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filePath = path.join(UPLOAD_DIR, fileName);
    await fs.writeFile(filePath, Buffer.from(imageBase64, "base64"));
    return filePath;
  }

  static async isValidBase64(str: string): Promise<boolean> {
    const base64Data = await removeMimeBase64(str);

    try {
      return btoa(atob(base64Data)) === base64Data;
    } catch (err) {
      return false;
    }
  }
}
