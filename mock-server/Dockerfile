# Use official Node.js runtime image
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 telemetry && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose UDP port
EXPOSE 5606/udp

# Environment variables with defaults
ENV TARGET_HOST=localhost
ENV UDP_PORT=5606
ENV SESSION_TYPE=race
ENV SESSION_DURATION=1800
ENV UPDATE_RATE=60
ENV TRACK_COMPLEXITY=medium
ENV ENABLE_TIRE_DEGRADATION="true"
ENV ENABLE_FUEL_CONSUMPTION="true"
ENV ENABLE_WEATHER_CHANGES="false"
ENV AI_DRIVERS_COUNT=19
ENV VERBOSITY=info

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Mock Server Health Check')" || exit 1

# Start mock server
CMD ["node", "mock-server.js"]