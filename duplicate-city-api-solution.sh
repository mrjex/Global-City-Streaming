#!/bin/bash

source .env

# Number of unique cities we want to get
TARGET_UNIQUE_CITIES=10

# Extra cities to fetch to account for potential duplicates
DUPLICATE_BUFFER=4

# Total number of cities to request from API
FETCH_LIMIT=$((TARGET_UNIQUE_CITIES + DUPLICATE_BUFFER))

# Country code for the query
COUNTRY_CODE=DE

# Temporary file to store API response
API_RESPONSE=$(curl -s -X GET "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=${COUNTRY_CODE}&limit=${FETCH_LIMIT}&sort=-population&types=CITY" \
     -H "X-RapidAPI-Host: wft-geo-db.p.rapidapi.com" \
     -H "X-RapidAPI-Key: ${GEODB_CITIES_API_KEY}")

# Extract unique cities and take only the first TARGET_UNIQUE_CITIES
echo "$API_RESPONSE" | jq -r '.data[].city' | sort -u | head -n "$TARGET_UNIQUE_CITIES"