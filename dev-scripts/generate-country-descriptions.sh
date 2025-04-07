#!/bin/bash

# Load OpenAI API key from .env file
source ../.env

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

# Initialize the JSON file with an opening brace
echo "{" > ../city-api/config/city-description.json

# Read the CSV file, skip the header line
tail -n +2 most_populated_cities.csv | while IFS=, read -r country city; do
    # Remove any quotes and trailing whitespace
    country=$(echo "$country" | tr -d '"' | xargs)
    city=$(echo "$city" | tr -d '"' | xargs)
    
    echo "Processing: $country - $city"
    
    # Craft the prompt
    PROMPT="Describe $city, the most populated city of $country in 2-3 sentences, focusing on its unique architectural features, cultural significance, and any notable landmarks. Add 2-3 relevant emojis that match the description's key features (like buildings, cultural elements, or landmarks). Make it engaging and informative."
    
    # Make the API call
    RESPONSE=$(curl -s https://api.openai.com/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -d "{
        \"model\": \"gpt-3.5-turbo\",
        \"messages\": [{
          \"role\": \"user\",
          \"content\": \"$PROMPT\"
        }],
        \"temperature\": 0.7,
        \"max_tokens\": 150
      }")
    
    # Extract the generated text from the response and format it for JSON
    # Use jq to properly escape the description for JSON
    DESCRIPTION=$(echo "$RESPONSE" | jq -r '.choices[0].message.content' | jq -R -s '.')
    
    # Add the entry to the JSON file
    # If it's not the first entry, add a comma
    if [ $(wc -l < ../city-api/config/city-description.json) -gt 1 ]; then
        echo "," >> ../city-api/config/city-description.json
    fi
    # Use jq to properly format the key and combine with the value
    KEY=$(echo "$country, $city" | jq -R '.')
    echo "    $KEY: $DESCRIPTION" >> ../city-api/config/city-description.json
    
    # Add a small delay to respect API rate limits
    sleep 0.5
done

# Close the JSON file with a closing brace
echo "}" >> ../city-api/config/city-description.json

# Validate and format the JSON file
if jq '.' ../city-api/config/city-description.json > temp.json; then
    mv temp.json ../city-api/config/city-description.json
    echo "Successfully generated city descriptions!"
else
    echo "Error: Generated JSON is invalid"
    exit 1
fi






