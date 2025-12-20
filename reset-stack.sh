#!/bin/bash

# Racing Telemetry Stack Reset & Deployment Script
# Gestione completa backend/frontend/mock-server in monorepo

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
    
    # Kill any running containers using our ports
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

# Function to remove containers
remove_containers() {
    print_message $YELLOW "🗑️  Removing containers..."
    
    # Remove containers
    docker rm -f $(docker ps -aq --filter "publish=8080" 2>/dev/null) 2>/dev/null || true
    docker rm -f $(docker ps -aq --filter "publish=4200" 2>/dev/null) 2>/dev/null || true
    docker rm -f $(docker ps -aq --filter "publish=5606" 2>/dev/null) 2>/dev/null || true
    
    print_message $GREEN "✅ Containers removed"
}

# Function to remove images
remove_images() {
    print_message $YELLOW "🏷️  Removing images..."
    
    # Remove our custom images
    docker rmi -f telemetry-reader-backend 2>/dev/null || true
    docker rmi -f telemetry-frontend 2>/dev/null || true
    docker rmi -f racing-telemetry-mock 2>/dev/null || true
    
    print_message $GREEN "✅ Images removed"
}

# Function to clean up volumes
clean_volumes() {
    print_message $YELLOW "📦 Cleaning up volumes..."
    
    # Remove anonymous volumes
    docker volume prune -f 2>/dev/null || true
    
    print_message $GREEN "✅ Volumes cleaned"
}

# Function to build backend
build_backend() {
    print_message $CYAN "🔨 Building backend..."
    
    cd "$BACKEND_DIR"
    export PATH=$PATH:/tmp/apache-maven-3.9.6/bin
    
    # Check if Maven wrapper exists
    if [ -f "mvnw" ]; then
        ./mvnw clean package -DskipTests
    else
        export PATH=$PATH:/tmp/apache-maven-3.9.6/bin
        mvn clean package -DskipTests
    fi
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✅ Backend built successfully"
    else
        print_message $RED "❌ Backend build failed"
        exit 1
    fi
}

# Function to build frontend
build_frontend() {
    print_message $CYAN "🎨 Building frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Build Angular app
    npm run build --prod
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "✅ Frontend built successfully"
    else
        print_message $RED "❌ Frontend build failed"
        exit 1
    fi
}

# Function to start services
start_services() {
    print_message $CYAN "🚀 Starting services..."
    
    cd "$SCRIPT_DIR"
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_message $RED "❌ docker-compose.yml not found at $COMPOSE_FILE"
        exit 1
    fi
    
    # Start with docker-compose
    docker compose up -d
    
    print_message $GREEN "✅ Services started"
}

# Function to start services for development (hot reload)
start_services_development() {
    print_message $CYAN "🚀 Starting services in development mode..."
    
    cd "$SCRIPT_DIR"
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_message $RED "❌ docker-compose.yml not found at $COMPOSE_FILE"
        exit 1
    fi
    
    # Start with docker-compose with hot reload volumes
    docker compose up -d
    
    print_message $GREEN "✅ Services started in development mode"
}

# Function to wait for services to be ready
wait_for_services() {
    print_message $YELLOW "⏳ Waiting for services to be ready..."
    
    # Wait for Spring Boot
    local spring_boot_ready=false
    for i in {1..30}; do
        if curl -s http://localhost:8080/v1/health > /dev/null 2>&1; then
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
    echo "   Mock Server running in standalone mode"
    echo "   To test: cd $MOCK_SERVER_DIR && node mock-server.js"
    echo ""
    echo -e "${CYAN}📊 Service URLs:${NC}"
    echo -e "   ${GREEN}Backend API:${NC} http://localhost:8080"
    echo -e "   ${GREEN}Frontend:${NC}   http://localhost:4200"
    echo -e "   ${GREEN}UDP Status:${NC} http://localhost:8080/v1/udp-status"
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
    if curl -s http://localhost:8080/v1/health > /dev/null 2>&1; then
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
    
    # UDP Server status
    if curl -s http://localhost:8080/v1/udp-status > /dev/null 2>&1; then
        local udp_status=$(curl -s http://localhost:8080/v1/udp-status 2>/dev/null | jq -r '.status' 2>/dev/null || echo "ACTIVE")
        if [ "$udp_status" = "ACTIVE" ]; then
            print_message $GREEN "✅ UDP Server: LISTENING (port 5606)"
        else
            print_message $YELLOW "⚠️  UDP Server: INACTIVE"
        fi
    else
        print_message $RED "❌ UDP Server: DOWN"
    fi
    
    # Mock Server status
    local mock_running=$(docker ps --filter "ancestor=racing-telemetry-mock" --format "table {{.Names}}" 2>/dev/null | grep -v NAMES || echo "")
    if [ -n "$mock_running" ]; then
        print_message $GREEN "✅ Mock Server: RUNNING"
    else
        print_message $RED "❌ Mock Server: DOWN"
    fi
    
    echo ""
}

# Function to development mode
start_development() {
    print_message $CYAN "🛠️  Starting development mode..."
    
    # Start backend in dev mode
    cd "$BACKEND_DIR"
    export PATH=$PATH:/tmp/apache-maven-3.9.6/bin
    mvn spring-boot:run &
    local backend_pid=$!
    echo "Backend PID: $backend_pid"
    
    # Start frontend in dev mode
    cd "$FRONTEND_DIR"
    ng serve &
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

# Function to show usage
show_usage() {
    echo -e "${CYAN}Usage: $0 [command]${NC}"
    echo ""
    echo -e "${PURPLE}Commands:${NC}"
    echo -e "  ${GREEN}start${NC}         Build and start all services (Docker)"
    echo -e "  ${GREEN}dev${NC}           Start development mode (hot reload)"
    echo -e "  ${GREEN}stop${NC}          Stop all services"
    echo -e "  ${GREEN}restart${NC}       Restart all services"
    echo -e "  ${GREEN}reset${NC}        Stop, remove containers and images"
    echo -e "  ${GREEN}clean${NC}        Deep clean (remove containers, images, volumes)"
    echo -e "  ${GREEN}build${NC}        Build all services"
    echo -e "  ${GREEN}build-backend${NC}   Build backend only"
    echo -e "  ${GREEN}build-frontend${NC}  Build frontend only"
    echo -e "  ${GREEN}logs${NC}         Show logs from running services"
    echo -e "  ${GREEN}status${NC}       Show current service status"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 start           # Build and start everything (Docker)"
    echo -e "  $0 dev             # Start development mode with hot reload"
    echo -e "  $0 restart         # Restart all services"
    echo -e "  $0 clean           # Deep clean everything"
    echo ""
}

# Parse command line arguments
case "${1:-help}" in
    "start")
        check_docker
        stop_containers
        start_services_development
        wait_for_services
        show_status
        ;;
    "dev"|"development")
        print_message $CYAN "🛠️  Starting development mode..."
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
        build_backend
        build_frontend
        start_services
        wait_for_services
        show_status
        ;;
    "reset")
        check_docker
        stop_containers
        remove_containers
        remove_images
        clean_volumes
        print_message $GREEN "✅ Reset completed"
        ;;
    "clean")
        check_docker
        stop_containers
        remove_containers
        remove_images
        clean_volumes
        print_message $GREEN "✅ Deep clean completed"
        ;;
    "build")
        build_backend
        build_frontend
        ;;
    "build-backend")
        build_backend
        ;;
    "build-frontend")
        build_frontend
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