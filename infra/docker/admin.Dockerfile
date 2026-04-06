FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace @papipo/contracts
RUN npm run build --workspace @papipo/admin

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=builder /app/apps/admin/next.config.ts ./apps/admin/next.config.ts
COPY --from=builder /app/apps/admin/app ./apps/admin/app
COPY --from=builder /app/apps/admin/lib ./apps/admin/lib
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY package.json ./
COPY packages/contracts/package.json packages/contracts/package.json
WORKDIR /app/apps/admin
CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
