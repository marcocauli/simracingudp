FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copy Maven files first for better layer caching
COPY pom.xml .

# Install Maven
RUN apk add --no-cache maven

# Copy source code
COPY main ./main
COPY test ./test

# Build application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Non-root user
RUN addgroup -g 1001 -S springbootapp && \
    adduser -u 1001 -S springbootapp -G springbootapp && \
    chown -R springbootapp:springbootapp /app
USER springbootapp

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]