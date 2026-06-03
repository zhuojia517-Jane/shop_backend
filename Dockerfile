FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --config.verify-deps-before-run=false

COPY prisma/ ./prisma/
RUN pnpm prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN pnpm build

COPY scripts/docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
