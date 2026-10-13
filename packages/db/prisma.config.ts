import { definePrismaConfig } from "prisma/config";
import { defineConfig } from "@prisma/orm-postgres/config";

// Offline artifact emission only: Neon owns neon_auth. Never migrate or sign it.
export default definePrismaConfig({
  parent: false,
  orm: defineConfig({
    contract: "prisma/contract.prisma",
    output: "generated",
  }),
});
