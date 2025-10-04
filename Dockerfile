# Use official Node.js image for building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install dependencies (prefer production install if appropriate)
RUN npm ci

# Copy the rest of the project
COPY . .

# Build the app
RUN npm run build

# Use official nginx image for serving static files
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP
EXPOSE 80

# Run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
