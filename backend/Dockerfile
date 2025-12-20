FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy Maven files first for better layer caching
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
COPY mvnw.cmd .

# Copy source code
COPY src ./src

# Make mvnw executable
RUN chmod +x mvnw

# Build application using Maven wrapper
RUN ./mvnw clean package -DskipTests

# Expose port
EXPOSE 8080

# Non-root user
RUN addgroup -g 1001 -S springbootapp && \
    adduser -u 1001 -S springbootapp -G springbootapp && \
    chown -R springbootapp:springbootapp /app
USER springbootapp

# Run application
ENTRYPOINT ["java", "-jar", "target/telemetry-reader-backend-0.0.1-SNAPSHOT.jar"]