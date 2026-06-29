import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { seedDemoData } from "./services/seed.service";

async function main() {
  await seedDemoData();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`SEAPEDIA API ready on http://localhost:${env.port}`);
    console.log("Demo admin: username admin / password Admin123!");
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
