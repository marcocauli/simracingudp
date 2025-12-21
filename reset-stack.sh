#!/bin/bash

# Racing Telemetry Stack Reset & Deployment Script
# Gestione completa backend/frontend/mock-server in monorepo con build esterna

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
MOCK_SERVER_DIR="$SCRIPT_DIR/mock-server"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

echo -e "${BLUE}🏁 Racing Telemetry Monorepo Stack Management${NC}"
echo -e "${BLUE}===============================================${NC}"

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_message $RED "❌ Docker is not running or not accessible"
        print_message $YELLOW "Please start Docker first"
        exit 1
    fi
}

# Function to stop existing containers
stop_containers() {
    print_message $YELLOW "🛑 Stopping existing containers..."
    
    # Stop all compose services
    cd "$SCRIPT_DIR"
    if docker compose ps -q 2>/dev/null | grep -q .; then
        docker compose down 2>/dev/null || true
        print_message $GREEN "✅ Containers stopped via docker compose"
    fi
    
    # Kill any remaining containers using our ports
    local containers_to_stop=$(docker ps -q --filter "publish=8080" 2>/dev/null || true)
    if [ -n "$containers_to_stop" ]; then
        docker stop $containers_to_stop
        print_message $GREEN "✅ Backend container stopped"
    fi
    
    local containers_to_stop_frontend=$(docker ps -q --filter "publish=4200" 2>/dev/null || true)
    if [ -n "$containers_to_stop_frontend" ]; then
        docker stop $containers_to_stop_frontend
        print_message $GREEN "✅ Frontend container stopped"
    fi
    
    local containers_to_stop_udp=$(docker ps -q --filter "publish=5606" 2>/dev/null || true)
    if [ -n "$containers_to_stop_udp" ]; then
        docker stop $containers_to_stop_udp
        print_message $GREEN "✅ Mock Server container stopped"
    fi
}

# Function to remove containers and images
cleanup_docker() {
    print_message $YELLOW "🗑️  Removing containers and images..."
    
    cd "$SCRIPT_DIR"
    
    # Remove containers and images via compose
    docker compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
    
    # Remove any remaining custom images
    docker rmi -f simracingapp-backend 2>/dev/null || true
    docker rmi -f simracingapp-frontend 2>/dev/null || true
    docker rmi -f simracingapp-mock-server 2>/dev/null || true
    
    print_message $GREEN "✅ Docker cleanup completed"
}

# Function to build backend externally
build_backend_external() {
    print_message $CYAN "🔨 Building backend externally..."
    
    cd "$BACKEND_DIR"
    
    # Fix ownership issues from previous Docker builds
    if [ -d "target" ]; then
        print_message $YELLOW "🔧 Fixing permissions from previous builds..."
        # Try to fix permissions without sudo
        find target -type f -exec chmod 644 {} \; 2>/dev/null || true
        find target -type d -exec chmod 755 {} \; 2>/dev/null || true
    fi
    
    # Check if Java is available locally
    if ! command -v java &> /dev/null; then
        print_message $YELLOW "⚠️  Java not found locally, using Docker for backend build to ensure Java 21 compatibility"
        
        # Use Docker for Maven build with proper user mapping
        docker run --rm \
            -v "$BACKEND_DIR":/app \
            -w /app \
            -u "$(id -u):$(id -g)" \
            eclipse-temurin:21-jdk-alpine \
            sh -c "apk add --no-cache maven && mvn clean package -DskipTests"
    else
        # Check Java version
        JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
        if [ "$JAVA_VERSION" -lt 21 ]; then
            print_message $YELLOW "⚠️  Java version $JAVA_VERSION detected, using Docker for backend build to ensure Java 21 compatibility"
            
            docker run --rm \
                -v "$BACKEND_DIR":/app \
                -w /app \
                -u "$(id -u):$(id -g)" \
                eclipse-temurin:21-jdk-alpine \
                sh -c "apk add --no-cache maven && mvn clean package -DskipTests"
        else
            # Check if target directory has permission issues
            if [ -d "target" ] && [ ! -w "target" ]; then
                print_message $YELLOW "⚠️  Permission issues detected in target directory, using Docker for build"
                
                docker run --rm \
                    -v "$BACKEND_DIR":/app \
                    -w /app \
                    eclipse-temurin:21-jdk-alpine \
                    sh -c "apk add --no-cache maven && mvn clean package -DskipTests && chown -R $(id -u):$(id -g) target/"
            else
                print_message $GREEN "✅ Using local Java for backend build"
                
                # Use local Maven if available, otherwise use Docker for Maven
                if command -v mvn &> /dev/null; then
                    # Try to clean first, but continue if it fails
                    mvn clean 2>/dev/null || true
                    mvn package -DskipTests
                else
                    docker run --rm \
                        -v "$BACKEND_DIR":/app \
                        -w /app \
                        -u "$(id -u):$(id -g)" \
                        eclipse-temurin:21-jdk-alpine \
                        sh -c "apk add --no-cache maven && mvn clean package -DskipTests"
                fi
            fi
        fi
    fi
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✅ Backend built successfully"
        
        # Verify JAR was created and copy to expected location
        JAR_FILE="target/telemetry-reader-backend-0.0.1-SNAPSHOT.jar"
        if [ -f "$JAR_FILE" ]; then
            print_message $GREEN "✅ JAR file created at $JAR_FILE"
            
            # Copy JAR to backend target for Docker
            mkdir -p "$BACKEND_DIR/target"
            if [ ! -f "$BACKEND_DIR/target/app.jar" ]; then
                cp "$JAR_FILE" "$BACKEND_DIR/target/app.jar"
                print_message $GREEN "✅ JAR copied to backend/target/app.jar for Docker"
            fi
        else
            print_message $RED "❌ JAR file not found after build"
            ls -la target/ || echo "target directory does not exist"
            exit 1
        fi
    else
        print_message $RED "❌ Backend build failed"
        exit 1
    fi
}

# Function to build frontend externally
build_frontend_external() {
    print_message $CYAN "🎨 Building frontend externally..."
    
    cd "$FRONTEND_DIR"
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        print_message $YELLOW "⚠️  Node.js not found locally, using Docker for frontend build..."
        
        # Use Docker for Node.js build
        docker run --rm \
            -v "$FRONTEND_DIR":/app \
            -w /app \
            node:20-alpine \
            sh -c "npm ci --legacy-peer-deps && npm run build"
    else
        # Check Node.js version
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        if [ "$NODE_VERSION" -lt 20 ]; then
            print_message $YELLOW "⚠️  Node.js version $NODE_VERSION detected, using Docker for frontend build..."
            
            docker run --rm \
                -v "$FRONTEND_DIR":/app \
                -w /app \
                node:20-alpine \
                sh -c "npm ci --legacy-peer-deps && npm run build"
        else
            print_message $GREEN "✅ Using local Node.js v$NODE_VERSION for frontend build"
            
            # Install dependencies if node_modules doesn't exist
            if [ ! -d "node_modules" ]; then
                npm ci --legacy-peer-deps
            fi
            
            # Build Angular app
            npm run build
        fi
    fi
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✅ Frontend built successfully"
        
        # Verify build was created
        if [ -d "dist/frontend" ]; then
            print_message $GREEN "✅ Frontend dist created successfully"
        else
            print_message $RED "❌ Frontend dist not found after build"
            exit 1
        fi
    else
        print_message $RED "❌ Frontend build failed"
        exit 1
    fi
}

# Function to start services with Docker build
start_services_with_build() {
    print_message $CYAN "🚀 Building Docker images and starting services..."
    
    cd "$SCRIPT_DIR"
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_message $RED "❌ docker-compose.yml not found at $COMPOSE_FILE"
        exit 1
    fi
    
    # Build and start with docker-compose (rebuilds from scratch each time)
    docker compose up --build -d
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✅ Services built and started successfully"
    else
        print_message $RED "❌ Failed to start services"
        exit 1
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    print_message $YELLOW "⏳ Waiting for services to be ready..."
    
    # Wait for Spring Boot
    local spring_boot_ready=false
    for i in {1..30}; do
        if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
            spring_boot_ready=true
            break
        fi
        echo -n "."
        sleep 2
    done
    echo
    
    if [ "$spring_boot_ready" = true ]; then
        print_message $GREEN "✅ Backend ready at http://localhost:8080"
    else
        print_message $RED "❌ Backend failed to start"
        return 1
    fi
    
    # Wait for Angular
    local angular_ready=false
    for i in {1..60}; do
        if curl -s http://localhost:4200 > /dev/null 2>&1; then
            angular_ready=true
            break
        fi
        echo -n "."
        sleep 3
    done
    echo
    
    if [ "$angular_ready" = true ]; then
        print_message $GREEN "✅ Frontend ready at http://localhost:4200"
    else
        print_message $RED "❌ Frontend failed to start"
        return 1
    fi
    
    # Show mock server status
    print_message $CYAN "📡 Mock Server info:"
    echo "   Mock Server running in container on UDP port 5606"
    echo ""
    echo -e "${CYAN}📊 Service URLs:${NC}"
    echo -e "   ${GREEN}Backend API:${NC} http://localhost:8080"
    echo -e "   ${GREEN}Frontend:${NC}   http://localhost:4200"
    echo -e "   ${GREEN}Backend Health:${NC} http://localhost:8080/actuator/health"
}

# Function to show logs
show_logs() {
    print_message $CYAN "📋 Showing logs (Ctrl+C to exit)..."
    docker compose -f "$COMPOSE_FILE" logs -f
}

# Function to show status
show_status() {
    print_message $CYAN "📊 Monorepo Service Status:"
    echo ""
    
    # Backend status
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        print_message $GREEN "✅ Backend: RUNNING (http://localhost:8080)"
    else
        print_message $RED "❌ Backend: DOWN"
    fi
    
    # Frontend status
    if curl -s http://localhost:4200 > /dev/null 2>&1; then
        print_message $GREEN "✅ Frontend: RUNNING (http://localhost:4200)"
    else
        print_message $RED "❌ Frontend: DOWN"
    fi
    
    # Mock Server status
    local mock_running=$(docker ps --filter "name=simracingapp-mock-server" --format "table {{.Names}}" 2>/dev/null | grep -v NAMES || echo "")
    if [ -n "$mock_running" ]; then
        print_message $GREEN "✅ Mock Server: RUNNING"
    else
        print_message $RED "❌ Mock Server: DOWN"
    fi
    
    echo ""
}

# Function to show usage
show_usage() {
    echo -e "${CYAN}Usage: $0 [command]${NC}"
    echo ""
    echo -e "${PURPLE}Commands:${NC}"
    echo -e "  ${GREEN}start${NC}         Build all sources externally and start services (Docker)"
    echo -e "  ${GREEN}dev${NC}           Start development mode (hot reload with local tools)"
    echo -e "  ${GREEN}stop${NC}          Stop all services"
    echo -e "  ${GREEN}restart${NC}       Rebuild and restart all services"
    echo -e "  ${GREEN}reset${NC}        Complete cleanup: stop, remove containers and images"
    echo -e "  ${GREEN}clean${NC}        Deep clean (remove containers, images, volumes)"
    echo -e "  ${GREEN}build${NC}        Build all sources externally (no Docker start)"
    echo -e "  ${GREEN}build-backend${NC}   Build backend only (external)"
    echo -e "  ${GREEN}build-frontend${NC}  Build frontend only (external)"
    echo -e "  ${GREEN}logs${NC}         Show logs from running services"
    echo -e "  ${GREEN}status${NC}       Show current service status"
    echo ""
    echo -e "${YELLOW}Workflow:${NC}"
    echo -e "  1. ${CYAN}$0 start${NC}         # Builds sources externally + Docker containers"
    echo -e "  2. ${CYAN}$0 dev${NC}           # Local development with hot reload"
    echo -e "  3. ${CYAN}$0 restart${NC}       # Full rebuild and restart"
    echo ""
}

# Development mode (local tools with hot reload)
start_development() {
    print_message $CYAN "🛠️  Starting development mode..."
    
    # Start backend in dev mode
    cd "$BACKEND_DIR"
    if [ -f "mvnw" ]; then
        ./mvnw spring-boot:run &
    else
        mvn spring-boot:run &
    fi
    local backend_pid=$!
    echo "Backend PID: $backend_pid"
    
    # Start frontend in dev mode
    cd "$FRONTEND_DIR"
    if command -v ng &> /dev/null; then
        ng serve &
    else
        npm start &
    fi
    local frontend_pid=$!
    echo "Frontend PID: $frontend_pid"
    
    # Start mock server
    cd "$MOCK_SERVER_DIR"
    node mock-server.js &
    local mock_pid=$!
    echo "Mock Server PID: $mock_pid"
    
    print_message $GREEN "✅ Development mode started"
    print_message $CYAN "Backend: http://localhost:8080 (dev mode)"
    print_message $CYAN "Frontend: http://localhost:4200 (dev mode)"
    print_message $CYAN "Mock Server: UDP port 5606"
    
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Wait for interrupt signal
    trap 'echo -e "\\n${CYAN}🛑 Stopping development services...${NC}"; kill $backend_pid $frontend_pid $mock_pid 2>/dev/null; exit 0' INT TERM
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Parse command line arguments
case "${1:-help}" in
    "start")
        check_docker
        stop_containers
        build_backend_external
        build_frontend_external
        start_services_with_build
        wait_for_services
        show_status
        ;;
    "dev"|"development")
        start_development
        ;;
    "stop")
        check_docker
        stop_containers
        print_message $GREEN "✅ All services stopped"
        ;;
    "restart")
        check_docker
        stop_containers
        build_backend_external
        build_frontend_external
        start_services_with_build
        wait_for_services
        show_status
        ;;
    "reset")
        check_docker
        stop_containers
        cleanup_docker
        print_message $GREEN "✅ Reset completed"
        ;;
    "clean")
        check_docker
        stop_containers
        cleanup_docker
        docker system prune -f
        print_message $GREEN "✅ Deep clean completed"
        ;;
    "build")
        build_backend_external
        build_frontend_external
        ;;
    "build-backend")
        build_backend_external
        ;;
    "build-frontend")
        build_frontend_external
        ;;
    "logs")
        show_logs
        ;;
    "status")
        check_docker
        show_status
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_message $RED "❌ Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac

echo ""
print_message $BLUE "🏁 Racing Telemetry Monorepo Stack Management Complete${NC}"