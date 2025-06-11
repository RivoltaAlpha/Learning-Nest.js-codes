#!/bin/bash

echo "Docker Start Script"
echo "=================="
echo ""
echo "Choose environment:"
echo "1) Development"
echo "2) Production"
echo ""

read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo " Starting in Development mode..."
        docker-compose  up -d
        echo "Development environment started."
        echo "Access the application at http://localhost:8000/docs"
        ;;
    2)
        echo " Starting in Production mode..."
        docker-compose -f docker-compose.prod.yml up -d
        echo "Production environment started."
        echo "Access the application at http://localhost:8000/docs"
        ;;
    *)
        echo "Invalid choice. Please run the script again and select 1 or 2."
        exit 1
        ;;
esac