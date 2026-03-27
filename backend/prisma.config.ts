import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrate: {
    adapter: async () => {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      return new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    },
  },
});
