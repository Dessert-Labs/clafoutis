# ---- Builder ----
FROM node:22 AS builder
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

COPY apps/server/package.json ./apps/server/
COPY packages/generators/package.json ./packages/generators/
COPY packages/shared/package.json ./packages/shared/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/prettier-config/package.json ./packages/prettier-config/
COPY packages/tsup-config/package.json ./packages/tsup-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/vitest-config/package.json ./packages/vitest-config/

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY apps/server ./apps/server
COPY packages ./packages
COPY turbo.json ./

RUN pnpm turbo build --filter=@clafoutis/server

# ---- Runner ----
FROM node:22-slim AS runner
WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/package.json ./

COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/

COPY --from=builder /app/packages/generators/dist ./packages/generators/dist
COPY --from=builder /app/packages/generators/package.json ./packages/generators/
COPY --from=builder /app/packages/generators/config.json ./packages/generators/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

RUN HUSKY=0 NODE_ENV=production pnpm install --prod --frozen-lockfile --ignore-scripts

WORKDIR /app/apps/server
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
