import { FastifyInstance } from "fastify";
import { PatchRequestBody } from "../types/index.js";
import { Measure } from "../services/measure.js";

async function confirmRoutes(fastify: FastifyInstance) {
  fastify.patch<{ Body: PatchRequestBody }>("/confirm", {
    schema: {
      // seu schema aqui
    },
    handler: async (request, reply) => {
      // sua lógica aqui
    },
  });
}

export default confirmRoutes;
