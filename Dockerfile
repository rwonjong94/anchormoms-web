# Frontend Dockerfile for Mogo Project (optimized)

FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat wget
WORKDIR /app
COPY package*.json ./
# Install full deps for build determinism and caching
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
# Build-time public envs
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KAKAO_CLIENT_ID
ARG NEXT_PUBLIC_IMAGE_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_KAKAO_CLIENT_ID=$NEXT_PUBLIC_KAKAO_CLIENT_ID
ENV NEXT_PUBLIC_IMAGE_BASE_URL=$NEXT_PUBLIC_IMAGE_BASE_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI
# Disable telemetry in CI
ENV NEXT_TELEMETRY_DISABLED=1
# Build (Next.js output: standalone enabled in next.config.ts)
RUN npm run build

FROM node:18-alpine AS runner
RUN apk add --no-cache wget
ENV NODE_ENV=production
WORKDIR /app
# Copy only runtime artifacts
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Ensure upload dir exists (mounted by volume at runtime)
RUN mkdir -p /app/public/images
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1
CMD ["node", "server.js"]