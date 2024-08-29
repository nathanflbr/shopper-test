import { FastifyInstance } from "fastify";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.resolve(__dirname, "../");
const UPLOAD_DIR = path.join(parentDir, "uploads");

async function uploadsRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { fileName: string } }>(
    "/uploads/:fileName",
    async (request, reply) => {
      // sua lógica aqui
    }
  );
}

export default uploadsRoutes;
