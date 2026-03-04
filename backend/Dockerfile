FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR from the host target directory
COPY target/telemetry-reader-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 18888

# Non-root user
RUN addgroup -g 1001 -S springbootapp && \
    adduser -u 1001 -S springbootapp -G springbootapp && \
    chown -R springbootapp:springbootapp /app
USER springbootapp

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]