#!/bin/bash

# Load environment variables
source ../.env

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

# Initialize output files
echo "{" > ../city-api/config/city-videos.json
echo "{" > ../city-api/config/cities-data.json

# Make scripts executable
chmod +x fetch-cities.sh
chmod +x fetch-city-videos.sh

# Initialize counters for JSON formatting
cities_count=0
videos_count=0

# Process each line from the CSV
tail -n +2 most_populated_cities_with_codes_TEMP.csv | while IFS=, read -r country city code; do
    # Remove any quotes and trailing whitespace
    country=$(echo "$country" | tr -d '"' | xargs)
    city=$(echo "$city" | tr -d '"' | xargs)
    code=$(echo "$code" | tr -d '"' | xargs)
    
    # Skip if country code is empty
    if [ -z "$code" ]; then
        echo "Skipping $country - $city (no country code)"
        continue
    fi
    
    echo "Processing: $country ($code) - $city"
    
    # Fetch cities data
    ./fetch-cities.sh "$country" "$code"
    if [ $? -ne 0 ]; then
        echo "Error fetching cities for $country"
        continue
    fi
    
    # Check if temp_cities.json exists and is not empty
    if [ ! -s temp_cities.json ]; then
        echo "No cities data generated for $country"
        continue
    fi
    
    # Fetch video for the main city
    ./fetch-city-videos.sh "$country" "$city"
    if [ $? -ne 0 ]; then
        echo "Error fetching video for $city, $country"
        continue
    fi
    
    # Check if temp_videos.json exists and is not empty
    if [ ! -s temp_videos.json ]; then
        echo "No video data generated for $city, $country"
        continue
    fi
    
    # Add comma for JSON formatting if not first entry
    if [ $cities_count -gt 0 ]; then
        echo "," >> ../city-api/config/cities-data.json
    fi
    if [ $videos_count -gt 0 ]; then
        echo "," >> ../city-api/config/city-videos.json
    fi
    
    # Append the data to respective files
    cat temp_cities.json | sed '1s/^.//' | sed '$s/.$//' >> ../city-api/config/cities-data.json
    cat temp_videos.json | sed '1s/^.//' | sed '$s/.$//' >> ../city-api/config/city-videos.json
    
    cities_count=$((cities_count + 1))
    videos_count=$((videos_count + 1))
    
    # Add a small delay to respect API rate limits
    sleep 1
done

# Close the JSON files
echo "}" >> ../city-api/config/cities-data.json
echo "}" >> ../city-api/config/city-videos.json

# Clean up temporary files
rm -f temp_cities.json temp_videos.json

# Validate and format the JSON files
if jq '.' ../city-api/config/cities-data.json > temp.json; then
    mv temp.json ../city-api/config/cities-data.json
    echo "Successfully generated cities data!"
else
    echo "Error: Generated cities JSON is invalid"
    exit 1
fi

if jq '.' ../city-api/config/city-videos.json > temp.json; then
    mv temp.json ../city-api/config/city-videos.json
    echo "Successfully generated city videos!"
else
    echo "Error: Generated videos JSON is invalid"
    exit 1
fi 