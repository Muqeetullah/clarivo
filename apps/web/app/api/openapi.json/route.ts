import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { contract } from "@clarivo/shared";

const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
});
export async function GET() {
  const specification = await generator.generate(contract, {
    version: "3.2.0",
    base: {
      info: { title: "Clarivo live chat API", version: "1.0.0" },
      servers: [{ url: "/api" }],
    },
  });
  return Response.json(specification, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
