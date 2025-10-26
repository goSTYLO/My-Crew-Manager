#!/bin/bash
echo "Setting up network access..."
echo "Enter your device IP address (e.g., 192.168.1.100):"
read DEVICE_IP

# Update .env
sed -i "s/DEVICE_IP=.*/DEVICE_IP=$DEVICE_IP/" .env
sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://$DEVICE_IP:8000|" .env
sed -i "s|MOBILE_API_BASE_URL=.*|MOBILE_API_BASE_URL=http://$DEVICE_IP:8000|" .env

# Sync mobile config
python scripts/sync_mobile_config.py

echo "Configuration updated! Start Django with:"
echo "python manage.py runserver 0.0.0.0:8000"
