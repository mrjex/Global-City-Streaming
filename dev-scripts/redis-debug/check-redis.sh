#!/bin/bash

# Run this script with: bash check_redis.sh

echo "Fetching all Redis keys and their values..."
echo "============================================"

# Get all keys
KEYS=$(docker exec redis redis-cli --scan --pattern "*")

# For each key, get type and display its value accordingly
for KEY in $KEYS; do
  # Get the key type
  TYPE=$(docker exec redis redis-cli type "$KEY")
  
  echo -e "\nKEY: $KEY"
  echo "TYPE: $TYPE"
  echo "VALUE:"

  case $TYPE in
    "string")
      docker exec redis redis-cli get "$KEY"
      ;;
    "list")
      docker exec redis redis-cli lrange "$KEY" 0 -1
      ;;
    "set")
      echo "$(docker exec redis redis-cli smembers "$KEY")"
      ;;
    "zset")
      docker exec redis redis-cli zrange "$KEY" 0 -1 WITHSCORES
      ;;
    "hash")
      # For hash, format key-value pairs more nicely
      HASH_VALUES=$(docker exec redis redis-cli hgetall "$KEY")
      
      # Print key-value pairs on separate lines
      i=0
      for val in $HASH_VALUES; do
        if [ $((i % 2)) -eq 0 ]; then
          echo -n "$val: "
        else
          echo "$val"
        fi
        i=$((i+1))
      done
      ;;
    *)
      echo "Unknown type: $TYPE"
      ;;
  esac
  
  echo "--------------------------------------------"
done

# Check for specific Redis structures we're interested in
echo -e "\nChecking specific Redis structures..."

# Check if static:cities:all exists
if docker exec redis redis-cli exists static:cities:all | grep -q 1; then
  echo -e "\nstatic:cities:all (Set of all static city names):"
  docker exec redis redis-cli smembers static:cities:all
fi

# Check if there are country codes
if docker exec redis redis-cli exists static:country_codes | grep -q 1; then
  echo -e "\nstatic:country_codes (Country to code mapping):"
  docker exec redis redis-cli hgetall static:country_codes
fi

echo "============================================"
echo "Finished displaying all Redis keys and values" 