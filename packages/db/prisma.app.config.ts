import { definePrismaConfig } from "prisma/config";
import { defineConfig } from "@prisma/orm-postgres/config";

// Application-owned lineage only. Never include neon_auth in this contract.
export default definePrismaConfig({
  parent: false,
  orm: defineConfig({
    contract: "prisma/app/contract.prisma",
    output: "generated-app",
    db: { connection: process.env.DATABASE_URL },
    migrations: { dir: "migrations" },
  }),
});
