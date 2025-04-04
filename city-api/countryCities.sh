#!/bin/sh

echo "Starting country cities script..." >&2
echo "Current directory: $(pwd)" >&2

# Step 1: Get the cities of a specific country
COUNTRY="$1"
echo "Fetching cities for country: $COUNTRY" >&2

# Store the curl response in a variable
RESPONSE=$(curl -s "https://countriesnow.space/api/v0.1/countries/cities/q?country=$COUNTRY")

# Extract cities into an array and get count
CITIES=$(echo "$RESPONSE" | jq -r '.data[]')
CITY_COUNT=$(echo "$CITIES" | wc -l)
echo "Found $CITY_COUNT cities to process" >&2

# Process cities in smaller batches
BATCH_SIZE=5
CURRENT=0

echo "$CITIES" | while read -r city; do
    if [ -n "$city" ]; then
        CURRENT=$((CURRENT + 1))
        echo "Processing city ($CURRENT/$CITY_COUNT): $city" >&2
        python /app/city-api/apis/process_cities.py "$city"
        
        # Add a small delay between API calls to prevent overwhelming
        sleep 0.1
        
        # Progress update every 5 cities
        if [ $((CURRENT % 5)) -eq 0 ]; then
            echo "Progress: $CURRENT/$CITY_COUNT cities processed" >&2
        fi
    fi
done

echo "Completed processing all $CITY_COUNT cities" >&2

# Step 2: Iterate through the cities and get the weather temperature
# TODO: Implement weather data fetching in next step

