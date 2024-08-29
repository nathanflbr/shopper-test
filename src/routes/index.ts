import { FastifyInstance } from "fastify";
import { ImageAnalyzer } from "../services/image_analyzer.js";
import uploadRoutes from "./upload.js";
import confirmRoutes from "./confirm.js";
import listRoutes from "./list.js";
import uploadsRoutes from "./uploads.js";

async function routes(fastify: FastifyInstance, imageAnalyzer: ImageAnalyzer) {
  fastify.register(uploadRoutes, imageAnalyzer);
  fastify.register(confirmRoutes);
  fastify.register(listRoutes);
  fastify.register(uploadsRoutes);
}

export default routes;
