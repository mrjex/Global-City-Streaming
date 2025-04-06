#!/bin/bash

# Debug output redirected to stderr so it doesn't interfere with JSON output
debug() {
    echo "$1" >&2
}

debug "=== SCRIPT START ==="
debug "Testing basic output"
debug "Current directory: $(pwd)"
debug "Script arguments: $@"

# Step 1: Get the country code for the given country
COUNTRY="$1"
debug "Input country: $COUNTRY"

# Get country code from Python script
debug "Getting country code..."
debug "Running: python /app/city-api/apis/countryCodeApi.py \"$COUNTRY\""
COUNTRY_CODE_OUTPUT=$(python /app/city-api/apis/countryCodeApi.py "$COUNTRY")
debug "Raw country code output: $COUNTRY_CODE_OUTPUT"

COUNTRY_CODE=$(echo "$COUNTRY_CODE_OUTPUT" | grep "Country Code (alpha-2):" | cut -d ":" -f2 | tr -d ' ')
debug "Extracted country code: '$COUNTRY_CODE'"

if [ -z "$COUNTRY_CODE" ]; then
    debug "Error: Failed to get country code"
    exit 1
fi

# Get number of cities from configuration
debug "Getting number of cities from configuration..."
CITIES_LIMIT=$(yq '.services.cityApi.numberOfCitiesForSelectedCountry' /app/configuration.yml)
debug "Number of cities to fetch: $CITIES_LIMIT"

# Store the curl response in a variable
debug "Making API request for country code: $COUNTRY_CODE..."
RESPONSE=$(curl -X GET "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=$COUNTRY_CODE&limit=$CITIES_LIMIT&sort=-population&types=CITY" \
  -H "X-RapidAPI-Host: wft-geo-db.p.rapidapi.com" \
  -H "X-RapidAPI-Key: $GEODB_CITIES_API_KEY")

debug "Raw API Response:"
debug "$RESPONSE"

# Extract cities into an array and get count
debug "Extracting cities..."
CITIES=$(echo "$RESPONSE" | jq -r '.data[].city' | tr '\n' '|')
CITY_COUNT=$(echo "$CITIES" | tr '|' '\n' | grep -v '^$' | wc -l)
debug "Found $CITY_COUNT cities to process"

# Get the capital city (first city in response)
CAPITAL_CITY=$(echo "$RESPONSE" | jq -r '.data[0].city')
debug "Capital city: $CAPITAL_CITY"

# Get Giphy video for capital city
debug "Getting Giphy video for $CAPITAL_CITY..."
GIPHY_RESPONSE=$(curl -G "https://api.giphy.com/v1/gifs/search" \
--data-urlencode "api_key=$GIPHY_API_KEY" \
--data-urlencode "q=$COUNTRY $CAPITAL_CITY aerial view" \
--data-urlencode "limit=1" \
--data-urlencode "offset=0" \
--data-urlencode "rating=g" \
--data-urlencode "lang=en" \
-s)

# Extract MP4 URL
MP4_URL=$(echo $GIPHY_RESPONSE | jq -r '.data[0].images.original.mp4')
debug "MP4 URL: $MP4_URL"

# Initialize variables for collecting city data
CITY_DATA_ARRAY=""
SEPARATOR=""
CURRENT=0

# Process cities and collect their data
debug "Starting city processing..."
OLDIFS="$IFS"
IFS='|'
for city in $CITIES; do
    if [ -n "$city" ]; then
        CURRENT=$((CURRENT + 1))
        debug "Processing city ($CURRENT/$CITY_COUNT): $city"
        # Store the city data with proper JSON formatting and ensure only JSON output is captured
        CITY_JSON=$(python /app/city-api/apis/process_cities.py "$city" 2>&2 | grep -E '^{.*}$')
        CITY_DATA_ARRAY="${CITY_DATA_ARRAY}${SEPARATOR}${CITY_JSON}"
        SEPARATOR=","
        sleep 0.1
    fi
done
IFS="$OLDIFS"

# Output the complete JSON structure
echo "{"
echo "  \"success\": true,"
echo "  \"country\": \"$COUNTRY\","
echo "  \"country_code\": \"$(echo $COUNTRY_CODE | tr '[:upper:]' '[:lower:]')\","
echo "  \"capital_city_video_link\": \"$MP4_URL\","
echo "  \"cities\": ["
echo "    ${CITY_DATA_ARRAY}"
echo "  ]"
echo "}"

debug "=== SCRIPT END ==="