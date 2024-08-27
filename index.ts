import fastify from "fastify";

const server = fastify();

server.post("/upload", async (request, reply) => {
  return "test\n";
});

server.listen({ host: "127.0.0.1", port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
