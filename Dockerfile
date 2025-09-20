# ===========================================
# Frontend Dockerfile - Multi-stage build
# ===========================================

# Stage 1: Development
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY . .

# Expose port
EXPOSE ${VITE_FRONTEND_PORT:-5173}

# Development command
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Stage 2: Production Build
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_WEBSOCKET_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_LOG_LEVEL
ARG VITE_ENABLE_DEBUG_LOGGING
ARG VITE_NODE_ENV

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_LOG_LEVEL=$VITE_LOG_LEVEL
ENV VITE_ENABLE_DEBUG_LOGGING=$VITE_ENABLE_DEBUG_LOGGING
ENV VITE_NODE_ENV=$VITE_NODE_ENV

# Build the application
RUN pnpm build

# Stage 3: Production Server
FROM nginx:alpine AS production-server

# Copy built files
COPY --from=production /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE ${VITE_FRONTEND_PORT:-80}

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
