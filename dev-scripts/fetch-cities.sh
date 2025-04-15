#!/bin/bash

# Load environment variables
source ../.env

# Function to display usage
usage() {
    echo "Usage: $0 <country> <country_code>"
    echo "Example: $0 'Sweden' 'SE'"
    exit 1
}

# Check if both arguments are provided
if [ $# -ne 2 ]; then
    usage
fi

COUNTRY="$1"
COUNTRY_CODE="$2"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

# Get number of cities from configuration
CITIES_LIMIT=10

# Make the API request
echo "Fetching cities for $COUNTRY ($COUNTRY_CODE)..."
RESPONSE=$(curl -s -X GET "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=$COUNTRY_CODE&limit=$CITIES_LIMIT&sort=-population&types=CITY" \
    -H "X-RapidAPI-Host: wft-geo-db.p.rapidapi.com" \
    -H "X-RapidAPI-Key: $GEODB_CITIES_API_KEY")

# Check if the response contains an error
if echo "$RESPONSE" | jq -e 'has("errors")' > /dev/null; then
    echo "Error in API response:"
    echo "$RESPONSE" | jq '.errors'
    exit 1
fi

# Extract cities and create JSON structure
CITIES_JSON=$(echo "$RESPONSE" | jq -r --arg country "$COUNTRY" --arg code "$COUNTRY_CODE" '{
    ($country): {
        country_code: $code,
        cities: [.data[].city]
    }
}')

# Output to temporary file
echo "$CITIES_JSON" > "temp_cities.json"

echo "Cities data saved to temp_cities.json" 