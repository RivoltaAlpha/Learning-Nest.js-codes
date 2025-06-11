#!/bin/bash

echo "Docker Stop Script"
echo "=================="
echo ""
echo "Choose environment:"
echo "1) Development"
echo "2) Production"
echo "3) Both"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "Stopping development environment..."
        docker-compose down
        echo "Development environment stopped!"
        ;;
    2)
        echo "Stopping production environment..."
        docker-compose -f docker-compose.prod.yml down
        echo "Production environment stopped!"
        ;;
    3)
        echo "Stopping all environments..."
        docker-compose down
        docker-compose -f docker-compose.prod.yml down
        echo "All environments stopped!"
        ;;
    *)
        echo "Invalid choice. Please run the script again and select 1, 2, or 3."
        exit 1
        ;;
esac
