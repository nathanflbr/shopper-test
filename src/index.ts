import fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import fastifyStatic from "@fastify/static";
import { v4 as uuidv4 } from "uuid";
import { promises as fs, read } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { ImageService } from "./services/image_service.js";
import { ImageAnalyzer } from "./services/image_analyzer.js";
import {
  ListQuery,
  PatchRequestBody,
  UploadBody,
  UploadResponse,
} from "./types/index.js";
import { removeMimeBase64 } from "./utils/validade.js";
import { Customer } from "./services/customer.js";
import { Measure } from "./services/measure.js";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const currentDir = __dirname;
const parentDir = path.resolve(currentDir, "../");
const UPLOAD_DIR = path.join(parentDir, "uploads");

function createServer(imageAnalyzer: ImageAnalyzer): FastifyInstance {
  const server = fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

  server.register(fastifyStatic, {
    root: UPLOAD_DIR,
    prefix: "/uploads/",
  });

  server.post<{ Body: UploadBody; Reply: UploadResponse }>(
    "/upload",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "image",
            "customer_code",
            "measure_datetime",
            "measure_type",
          ],
          properties: {
            image: {
              type: "string",
              pattern: "^(data:image\\/(png|jpeg|jpg|webp);base64,)?.*$",
            },
            customer_code: { type: "string" },
            measure_datetime: { type: "string", format: "date-time" },
            measure_type: { type: "string", enum: ["WATER", "GAS"] },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: UploadBody }>,
      reply: FastifyReply
    ): Promise<UploadResponse> => {
      const { image, customer_code, measure_datetime, measure_type } =
        request.body;

      try {
        const customer = new Customer(customer_code);

        const customerCreate = await customer.create();

        const convertStringToDate = new Date(measure_datetime);

        // Generate UUID, File name e Url Da Imagem
        const guid = uuidv4();
        const fileName = `${guid}.jpg`;
        const imageUrl = `http://${request.hostname}/uploads/${fileName}`;

        if (!ImageService.isValidBase64(await removeMimeBase64(image))) {
          reply.code(400).send({ error: "Invalid image format" });
          throw new Error("Invalid image format");
        }

        const imageValue = await imageAnalyzer.extractValueFromImage(image);

        const measure = new Measure();

        const MeasureExist = await measure.existReading(
          measure_type,
          convertStringToDate,
          customerCreate.customer_code
        );

        if (MeasureExist) {
          reply.code(409).send({
            error_code: "DOUBLE_REPORT",
            error_description: `Leitura do mês já realizada`,
          });
          throw new Error("Measure already exists for this date");
        }

        const MeasureCreated = await measure.create(
          guid,
          convertStringToDate,
          measure_type,
          imageValue,
          customerCreate.customer_code
        );

        if (MeasureCreated === null) {
          reply.code(500).send({ error_code: "CREATING_ERROR" });
          throw new Error("Error creating measure");
        }

        await ImageService.create(guid, imageUrl, MeasureCreated.id);
        await ImageService.saveImage(await removeMimeBase64(image), fileName);

        return {
          image_url: imageUrl,
          measure_value: imageValue,
          measure_uuid: guid,
        };
      } catch (error) {
        console.log(error);
        reply.code(500).send({ error: "Internal server error" });
        throw error;
      }
    }
  );

  server.patch<{ Body: PatchRequestBody }>("/confirm", {
    schema: {
      body: {
        type: "object",
        required: ["measure_uuid", "confirmed_value"],
        properties: {
          measure_uuid: { type: "string" },
          confirmed_value: { type: "integer" },
        },
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: PatchRequestBody }>,
      reply: FastifyReply
    ) => {
      const { measure_uuid, confirmed_value } = request.body;
      try {
        const measure = await new Measure();

        const measureFind = await measure.findByUUID(measure_uuid);

        if (!measureFind) {
          return reply.status(404).send({
            error_code: "MEASURE_NOT_FOUND",
            error_description: "Leitura não encontrada",
          });
        }

        if (measureFind.confirmed) {
          return reply.status(409).send({
            error_code: "CONFIRMATION_DUPLICATE",
            error_description: "Leitura do mês já realizada",
          });
        }

        await measure.confirm(measure_uuid, confirmed_value);

        return reply.status(200).send({ success: true });
      } catch (error) {
        server.log.error(error);
        return reply.status(500).send({
          error_code: "INTERNAL_SERVER_ERROR",
          error_description: "Ocorreu um erro interno no servidor",
        });
      }
    },
  });

  server.get<{ Querystring: ListQuery; Params: { customer_code: string } }>(
    "/:customer_code/list",
    async (request, reply) => {
      try {
        const customer_code = request.params.customer_code;
        const measure_type = request.query.measure_type;

        const measure = new Measure();

        if (
          measure_type &&
          measure_type !== "WATER" &&
          measure_type !== "GAS"
        ) {
          return reply.code(400).send({
            error_code: "INVALID_TYPE",
            error_description: `Tipo de medição não permitida`,
          });
        }

        const allMeasure = await measure.findAllMeasure(
          customer_code,
          measure_type
        );

        if (allMeasure.length <= 0) {
          return reply.code(404).send({
            error_code: "MEASURES_NOT_FOUND",
            error_description: `Nenhuma leitura encontrada`,
          });
        }

        return reply.code(200).send({
          customer_code,
          measures: allMeasure,
        });
      } catch {
        reply.code(500).send({
          error_code: "INTERNAL_SERVER_ERROR",
          error_description: "Ocorreu um erro interno no servidor",
        });
      }
    }
  );

  server.get<{ Params: { fileName: string } }>(
    "/uploads/:fileName",
    async (request, reply) => {
      const { fileName } = request.params;
      const filePath = path.join(UPLOAD_DIR, fileName);

      try {
        await fs.access(filePath);
        return reply.sendFile(fileName);
      } catch {
        reply.code(404).send("File not found");
      }
    }
  );

  return server;
}

async function startServer(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set in environment variables");
    process.exit(1);
  }

  const imageAnalyzer = new ImageAnalyzer(apiKey);
  const server = createServer(imageAnalyzer);

  try {
    await server.listen({ port: 3000 });
    console.log("Server started on port 3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

startServer();
