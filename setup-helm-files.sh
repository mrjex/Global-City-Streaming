#!/bin/bash

# Create directory structure
mkdir -p helm/city-api/files/city-api/config
mkdir -p helm/city-api/files/shared/weather

# Copy city-api files
cp city-api/main.py helm/city-api/files/city-api/
cp city-api/config/configuration.yml helm/city-api/files/city-api/config/
cp city-api/config/city-edits.yml helm/city-api/files/city-api/config/
cp city-api/config/country-codes.json helm/city-api/files/city-api/config/

# Copy shared files
cp shared/utils.py helm/city-api/files/shared/
cp shared/weather/api.py helm/city-api/files/shared/weather/
cp shared/weather/city_coordinates.py helm/city-api/files/shared/weather/

# Create __init__.py files
touch helm/city-api/files/city-api/__init__.py
touch helm/city-api/files/shared/__init__.py
touch helm/city-api/files/shared/weather/__init__.py

echo "Helm chart files structure created successfully" 