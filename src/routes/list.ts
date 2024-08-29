import { FastifyInstance } from "fastify";
import { ListQuery } from "../types/index.js";
import { Measure } from "../services/measure.js";

async function listRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ListQuery; Params: { customer_code: string } }>(
    "/:customer_code/list",
    async (request, reply) => {
      // sua lógica aqui
    }
  );
}

export default listRoutes;
