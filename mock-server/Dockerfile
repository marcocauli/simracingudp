#!/bin/bash

# Dockerfile for Racing Telemetry Mock Server

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mockuser -u 1001

# Change ownership of app directory
RUN chown -R mockuser:nodejs /app
USER mockuser

# Expose UDP port
EXPOSE 5606/udp

# Environment variables with defaults
ENV UDP_PORT=5606
ENV TARGET_HOST=127.0.0.1
ENV SESSION_TYPE=race
ENV SESSION_DURATION=1800
ENV UPDATE_RATE=60
ENV TRACK_COMPLEXITY=medium
ENV ENABLE_TIRE_DEGRADATION=true
ENV ENABLE_FUEL_CONSUMPTION=true
ENV ENABLE_WEATHER_CHANGES=false
ENV AI_DRIVERS_COUNT=19
ENV VERBOSITY=info

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check')" || exit 1

# Start the mock server
CMD ["npm", "start"]