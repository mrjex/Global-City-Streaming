#!/bin/sh

echo "Starting country cities script..."
echo "Current directory: $(pwd)"

# Step 1: Get the cities of a specific country
COUNTRY="$1"
echo "Fetching cities for country: $COUNTRY"

# Store the curl response in a variable
RESPONSE=$(curl -s "https://countriesnow.space/api/v0.1/countries/cities/q?country=$COUNTRY")

# Extract and print cities from the response using jq
echo "Cities found:"
echo "$RESPONSE" | jq -r '.data[]' 2>/dev/null || {
    echo "Error: Failed to parse response. Raw response:"
    echo "$RESPONSE"
    exit 1
}

# Step 2: Iterate through the cities and get the weather temperature
# TODO: Implement weather data fetching in next step

