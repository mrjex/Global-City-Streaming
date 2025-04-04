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
echo "Running: python /app/city-api/apis/countryCodeApi.py \"$COUNTRY\""
COUNTRY_CODE_OUTPUT=$(python /app/city-api/apis/countryCodeApi.py "$COUNTRY")
echo "Raw country code output: $COUNTRY_CODE_OUTPUT"

COUNTRY_CODE=$(echo "$COUNTRY_CODE_OUTPUT" | grep "Country Code (alpha-2):" | cut -d ":" -f2 | tr -d ' ')
echo "Extracted country code: '$COUNTRY_CODE'"

if [ -z "$COUNTRY_CODE" ]; then
    echo "Error: Failed to get country code"
    exit 1
fi

# Store the curl response in a variable
echo "Making API request for country code: $COUNTRY_CODE..."
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