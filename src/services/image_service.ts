import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { removeMimeBase64 } from "../utils/validade.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const currentDir = __dirname;
const parentDir = path.resolve(currentDir, "../../");
const UPLOAD_DIR = path.join(parentDir, "uploads");

export class ImageService {
  static async isValidBase64(str: string): Promise<boolean> {
    const base64Data = await removeMimeBase64(str);

    try {
      return btoa(atob(base64Data)) === base64Data;
    } catch (err) {
      return false;
    }
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
}
