import { z } from "@clafoutis/shared";

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
  FRONTEND_URL: z.string().optional().default(""),
});

export type Env = z.infer<typeof EnvSchema>;
