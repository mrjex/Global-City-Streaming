#!/bin/sh

echo "=== SCRIPT START ==="
echo "Testing basic output"
echo "Current directory: $(pwd)"
echo "Script arguments: $@"

# Step 1: Get the country code for the given country
COUNTRY="$1"
echo "Input country: $COUNTRY"

# Get country code from Python script
echo "Getting country code..."
COUNTRY_CODE=$(python /app/city-api/apis/countryCodeApi.py "$COUNTRY" | grep "Country Code (alpha-2):" | cut -d ":" -f2 | tr -d ' ')
echo "Retrieved country code: $COUNTRY_CODE"

# Store the curl response in a variable
echo "Making API request..."
RESPONSE=$(curl -X GET "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=$COUNTRY_CODE&limit=3&sort=-population&types=CITY" \
  -H "X-RapidAPI-Host: wft-geo-db.p.rapidapi.com" \
  -H "X-RapidAPI-Key: $GEODB_CITIES_API_KEY")

echo "Raw API Response:"
echo "$RESPONSE"

# Extract cities into an array and get count (updated for GeoDB API format)
echo "Extracting cities..."
CITIES=$(echo "$RESPONSE" | jq -r '.data[].city')
CITY_COUNT=$(echo "$CITIES" | grep -v '^$' | wc -l)
echo "Found $CITY_COUNT cities to process"

# Process cities in smaller batches
echo "Starting city processing..."
CURRENT=0

echo "$CITIES" | while read -r city; do
    if [ -n "$city" ]; then
        CURRENT=$((CURRENT + 1))
        echo "Processing city ($CURRENT/$CITY_COUNT): $city"
        python /app/city-api/apis/process_cities.py "$city"
        sleep 0.1
    fi
done

echo "=== SCRIPT END ==="