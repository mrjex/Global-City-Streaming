#!/bin/bash

# dynamic-city-logs.sh - Monitor dynamic city data logs in real-time
# Run with: bash dynamic-city-logs.sh

echo "Monitoring dynamic city data logs in real-time..."
echo "Press Ctrl+C to exit"
echo "================================================"
echo ""

# Use docker logs with follow option to stream logs in real-time
# The grep command filters for the specific log format
# The --color option highlights the matches for better visibility
docker logs frontend -f | grep --color=always "FETCHING DYNAMIC CITY DATA" 