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
import { PatchRequestBody, UploadBody, UploadResponse } from "./types/index.js";
import { removeMimeBase64 } from "./utils/validade.js";
import { Customer } from "./controllers/customer.js";
import { Reading } from "./controllers/readings.js";
import { ImageHandler } from "./controllers/images.js";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const currentDir = __dirname;
const parentDir = path.resolve(currentDir, "../");
const UPLOAD_DIR = path.join(parentDir, "uploads");

console.log(UPLOAD_DIR);

function createServer(imageAnalyzer: ImageAnalyzer): FastifyInstance {
  const server = fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

  server.setErrorHandler((error, request, reply) => {
    reply.status(500).send({ ok: false });
  });

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

        const customerResult = await customer.create();

        const convertStringToDate = new Date(measure_datetime);

        const imageCleaned = await removeMimeBase64(image);

        if (!ImageService.isValidBase64(imageCleaned)) {
          reply.code(400).send({ error: "Invalid image format" });
          throw new Error("Invalid image format");
        }

        const guid = uuidv4();
        const fileName = `${guid}.jpg`;

        const recognizedValue = await imageAnalyzer.extractValueFromImage(
          image
        );

        const imageUrl = `http://${request.hostname}/uploads/${fileName}`;

        const measure = new Reading(
          convertStringToDate,
          measure_type,
          recognizedValue,
          customerResult.customer_code
        );

        const MeasureExist = await measure.existReading();

        if (MeasureExist) {
          reply.code(409).send({
            error_code: "DOUBLE_REPORT",
            error_description: `Leitura do mês já realizada`,
          });
          throw new Error("Measure already exists for this date");
        }

        const MeasureCreated = await measure.create();

        if (MeasureCreated === null) {
          reply.code(500).send({ error_code: "CREATING_ERROR" });
          throw new Error("Error creating measure");
        }

        const handlerImage = new ImageHandler(
          guid,
          imageUrl,
          MeasureCreated.id
        );

        await handlerImage.create();

        await ImageService.saveImage(imageCleaned, fileName);

        return {
          image_url: imageUrl,
          measure_value: recognizedValue,
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
        // Verificar se o código de leitura existe
        const measure = await new Reading();
        /*         const measure = await prisma.measure.findUnique({
          where: { uuid: measure_uuid },
        }); */

        if (!measure) {
          return reply.status(404).send({
            error_code: "MEASURE_NOT_FOUND",
            error_description: "Leitura não encontrada",
          });
        }

        // Verificar se o código de leitura já foi confirmado
        if (measure.isConfirmed) {
          return reply.status(409).send({
            error_code: "CONFIRMATION_DUPLICATE",
            error_description: "Leitura do mês já realizada",
          });
        }

        // Salvar no banco de dados o novo valor informado
        /*         await prisma.measure.update({
          where: { uuid: measure_uuid },
          data: {
            confirmedValue: confirmed_value,
            isConfirmed: true,
          },
        }); */

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
