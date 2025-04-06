#!/bin/bash

# Load API key from .env file
source .env

# Store the curl response in a variable
RESPONSE=$(curl -G "https://api.giphy.com/v1/gifs/search" \
--data-urlencode "api_key=$GIPHY_API_KEY" \
--data-urlencode "q=Japan Tokyo aeiral view" \
--data-urlencode "limit=1" \
--data-urlencode "offset=0" \
--data-urlencode "rating=g" \
--data-urlencode "lang=en" \
-s)  # -s for silent mode

# Extract the MP4 URL using jq
MP4_URL=$(echo $RESPONSE | jq -r '.data[0].images.original.mp4')

echo "MP4 URL: $MP4_URL"