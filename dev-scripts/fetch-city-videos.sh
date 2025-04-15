#!/bin/bash

# Load environment variables
source ../.env

# Function to display usage
usage() {
    echo "Usage: $0 <country> <city>"
    echo "Example: $0 'Sweden' 'Stockholm'"
    exit 1
}

# Check if both arguments are provided
if [ $# -ne 2 ]; then
    usage
fi

COUNTRY="$1"
CITY="$2"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

# Check if GIPHY_API_KEY is set
if [ -z "$GIPHY_API_KEY" ]; then
    echo "Error: GIPHY_API_KEY environment variable is not set"
    exit 1
fi

# Make the API request to Giphy
echo "Fetching video for $CITY, $COUNTRY..."
RESPONSE=$(curl -s -G "https://api.giphy.com/v1/gifs/search" \
    --data-urlencode "api_key=$GIPHY_API_KEY" \
    --data-urlencode "q=$CITY aerial view city" \
    --data-urlencode "limit=5" \
    --data-urlencode "offset=0" \
    --data-urlencode "rating=g" \
    --data-urlencode "lang=en")

# Check if the response contains an error
if [ "$(echo "$RESPONSE" | jq -r '.meta.status')" != "200" ]; then
    echo "Error in API response:"
    echo "$RESPONSE" | jq '.meta'
    exit 1
fi

# Check if we got any results
if [ "$(echo "$RESPONSE" | jq '.data | length')" -eq 0 ]; then
    echo "No results found for $CITY, $COUNTRY. Trying alternative search..."
    # Try a more generic search
    RESPONSE=$(curl -s -G "https://api.giphy.com/v1/gifs/search" \
        --data-urlencode "api_key=$GIPHY_API_KEY" \
        --data-urlencode "q=$CITY skyline" \
        --data-urlencode "limit=5" \
        --data-urlencode "offset=0" \
        --data-urlencode "rating=g" \
        --data-urlencode "lang=en")
fi

# Extract first valid MP4 URL from results
VIDEO_JSON=$(echo "$RESPONSE" | jq --arg country "$COUNTRY" --arg city "$CITY" '{
    ($country + ", " + $city): {
        video_url: ([.data[].images.original.mp4][0] // null)
    }
}')

# Output to temporary file
echo "$VIDEO_JSON" > "temp_videos.json"

echo "Video data saved to temp_videos.json" 