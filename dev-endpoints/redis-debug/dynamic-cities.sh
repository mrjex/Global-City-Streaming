#!/bin/bash

# dynamic-cities.sh - Show all dynamic cities in Redis
# Run this script with: bash dynamic-cities.sh

echo "Fetching all dynamic cities from Redis..."
echo "=========================================="

# Get all countries from the dynamic countries set
COUNTRIES=$(docker exec redis redis-cli smembers "dynamic:countries:all")

if [ -z "$COUNTRIES" ]; then
  echo "No dynamic countries found in Redis."
  exit 0
fi

echo "Found countries: $COUNTRIES"
echo ""

# For each country, get its cities
for COUNTRY in $COUNTRIES; do
  echo "Country: $COUNTRY"
  echo "-----------------"
  
  # Get country data
  COUNTRY_KEY="dynamic:country:$COUNTRY"
  COUNTRY_DATA=$(docker exec redis redis-cli hgetall "$COUNTRY_KEY")
  
  echo "Country data:"
  # Format the country data nicely
  i=0
  for val in $COUNTRY_DATA; do
    if [ $((i % 2)) -eq 0 ]; then
      echo -n "  $val: "
    else
      echo "$val"
    fi
    i=$((i+1))
  done
  
  # Get the cities list
  CITIES_JSON=$(docker exec redis redis-cli hget "$COUNTRY_KEY" "cities")
  
  # Remove the quotes and brackets to get a simple list
  CITIES=$(echo $CITIES_JSON | sed 's/\[//g' | sed 's/\]//g' | sed 's/"//g' | sed 's/,/ /g')
  
  echo "Cities: $CITIES"
  echo ""
  
  # For each city, get its data
  for CITY in $CITIES; do
    CITY_KEY="dynamic:city:$COUNTRY:$CITY"
    
    echo "  City: $CITY"
    echo "  ----------------------"
    
    # Get city data
    CITY_DATA=$(docker exec redis redis-cli hgetall "$CITY_KEY")
    
    if [ -z "$CITY_DATA" ]; then
      echo "  No data found for this city"
      continue
    fi
    
    # Format the city data nicely
    i=0
    for val in $CITY_DATA; do
      if [ $((i % 2)) -eq 0 ]; then
        echo -n "    $val: "
      else
        echo "$val"
      fi
      i=$((i+1))
    done
    
    # Check if city has coordinates
    if docker exec redis redis-cli hexists "$CITY_KEY" "latitude" | grep -q 1 && \
       docker exec redis redis-cli hexists "$CITY_KEY" "longitude" | grep -q 1; then
      echo "    [HAS COORDINATES: YES]"
    else
      echo "    [HAS COORDINATES: NO]"
    fi
    
    echo ""
  done
  
  echo "=========================================="
done

echo "Finished displaying all dynamic cities" 