import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import morgan from "morgan";

import { getCorsConfig, getServerConfig } from "./config/index.js";
import generateRouter from "./routes/generate.js";
import healthRouter from "./routes/health.js";
import oauthRouter from "./routes/oauth.js";

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const corsConfig = getCorsConfig();
  const origin = req.headers.origin;
  const allowed = corsConfig.isOriginAllowed(origin);

  if (allowed) {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", corsConfig.allowedMethods);
    res.setHeader("Access-Control-Allow-Headers", corsConfig.allowedHeaders);
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

export function createApp(): Express {
  const serverConfig = getServerConfig();
  const app: Express = express();

  app.use(corsMiddleware);
  app.use(morgan(serverConfig.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "10mb" }));
  app.use(healthRouter);

  app.use("/__studio", oauthRouter);
  app.use("/__studio", generateRouter);

  return app;
}
