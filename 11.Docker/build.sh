#!/bin/bash

echo "Docker Build Script"
echo "=================="
echo "1) Development"
echo "2) Production"
echo ""
read -p "Choose environment (1 or 2): " choice

case $choice in
    1)
        echo "Building development environment..."
        docker-compose build --no-cache
        echo "Development build completed!"
        ;;
    2)
        echo "Building production environment..."
        docker-compose -f docker-compose.prod.yml build --no-cache
        echo "Production build completed!"
        ;;
    *)
        echo "Invalid choice. Please select 1 or 2."
        exit 1
        ;;
esac
