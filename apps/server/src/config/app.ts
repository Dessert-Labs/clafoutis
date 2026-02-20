import { envConfig } from "./env.js";

export const getServerConfig = () => ({
  port: envConfig.PORT,
  nodeEnv: envConfig.NODE_ENV,
});

export const getGitHubConfig = () => ({
  clientSecret: envConfig.GITHUB_CLIENT_SECRET,
});

export const getCorsConfig = () => ({
  isOriginAllowed: (origin: string | undefined): boolean => {
    if (!origin) return true;

    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      return true;
    }

    return !!envConfig.FRONTEND_URL && origin === envConfig.FRONTEND_URL;
  },
  allowedMethods: "GET, POST, OPTIONS",
  allowedHeaders: "Content-Type, Accept",
});
