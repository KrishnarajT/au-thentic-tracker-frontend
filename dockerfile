# Use official Bun image for build
FROM oven/bun:1.1.13-alpine AS builder

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .

# Build the app
RUN bun run build

# Use official nginx image for serving static files
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]