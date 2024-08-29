import { FastifyInstance } from "fastify";
import { UploadBody, UploadResponse } from "../types/index.js";
import { ImageService } from "../services/image_service.js";
import { ImageAnalyzer } from "../services/image_analyzer.js";
import { Customer } from "../services/customer.js";
import { Measure } from "../services/measure.js";
import { removeMimeBase64 } from "../utils/validade.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.resolve(__dirname, "../");
const UPLOAD_DIR = path.join(parentDir, "uploads");

async function uploadRoutes(
  fastify: FastifyInstance,
  imageAnalyzer: ImageAnalyzer
) {
  fastify.post<{ Body: UploadBody; Reply: UploadResponse }>("/upload", {
    schema: {
      // seu schema aqui
    },
    handler: async (request, reply) => {
      // sua lógica aqui
    },
  });
}

export default uploadRoutes;
