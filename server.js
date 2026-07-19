const { server, connectDatabase, closeDatabase } = require("./mongo-backend");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;

async function start() {
  const database = await connectDatabase();
  server.listen(PORT, HOST, () => {
    console.log(`SharePlate Connect is running at http://${HOST}:${PORT}`);
    console.log(`MongoDB database: ${database.databaseName}`);
  });
}

async function stop() {
  await closeDatabase();
  process.exit(0);
}

if (require.main === module) {
  start().catch((error) => {
    console.error("SharePlate could not start:", error.message);
    console.error("Make sure MongoDB is running at mongodb://localhost:27017/");
    process.exit(1);
  });
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

module.exports = { server, connectDatabase, closeDatabase };
