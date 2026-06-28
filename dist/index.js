"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const env_1 = require("./config/env");
const seed_service_1 = require("./services/seed.service");
async function main() {
    await (0, seed_service_1.seedLevelOneData)();
    const app = (0, app_1.createApp)();
    app.listen(env_1.env.port, () => {
        console.log(`SEAPEDIA API ready on http://localhost:${env_1.env.port}`);
        console.log("Demo admin: username admin / password Admin123!");
    });
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
