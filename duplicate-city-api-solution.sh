#!/bin/bash

source .env

# Number of unique cities we want to get
TARGET_UNIQUE_CITIES=7

# Extra cities to fetch to account for potential duplicates
DUPLICATE_BUFFER=3

# Total number of cities to request from API
FETCH_LIMIT=$((TARGET_UNIQUE_CITIES + DUPLICATE_BUFFER))

# Country code for the query
COUNTRY_CODE=DE


curl -s -X GET "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=${COUNTRY_CODE}&limit=${FETCH_LIMIT}&sort=-population&types=CITY" \
     -H "X-RapidAPI-Host: wft-geo-db.p.rapidapi.com" \
     -H "X-RapidAPI-Key: ${GEODB_CITIES_API_KEY}" | jq -r '.data[].city' | awk '!seen[$0]++' | head -n $TARGET_UNIQUE_CITIES


# TODO: New Zealand, Hamilton
