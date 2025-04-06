#!/bin/bash

# Load OpenAI API key from .env file
source ../.env

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed"
    exit 1
fi

# Initialize the JSON file with an opening brace
echo "{" > ../city-api/country-capital-config/city-description.json

# Read the CSV file, skip the header line
tail -n +2 country-capitals.csv | while IFS=, read -r country capital; do
    # Remove any quotes and trailing whitespace
    country=$(echo "$country" | tr -d '"' | xargs)
    capital=$(echo "$capital" | tr -d '"' | xargs)
    
    echo "Processing: $country - $capital"
    
    # Craft the prompt
    PROMPT="Describe the capital city $capital of $country in 2-3 sentences, focusing on its unique architectural features, cultural significance, and any notable landmarks. Make it engaging and informative."
    
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
    
    # Extract the generated text from the response
    DESCRIPTION=$(echo $RESPONSE | jq -r '.choices[0].message.content')
    
    # Escape any double quotes in the description
    DESCRIPTION=$(echo "$DESCRIPTION" | sed 's/"/\\"/g')
    
    # Add the entry to the JSON file
    # If it's not the first entry, add a comma
    if [ $(wc -l < ../city-api/country-capital-config/city-description.json) -gt 1 ]; then
        echo "," >> ../city-api/country-capital-config/city-description.json
    fi
    echo "    \"$country, $capital\": \"$DESCRIPTION\"" >> ../city-api/country-capital-config/city-description.json
    
    # Add a small delay to respect API rate limits
    sleep 1
done

# Close the JSON file with a closing brace
echo "}" >> ../city-api/country-capital-config/city-description.json

# Validate the JSON file
if jq '.' ../city-api/country-capital-config/city-description.json > /dev/null 2>&1; then
    echo "Successfully generated city descriptions!"
else
    echo "Error: Generated JSON is invalid"
    exit 1
fi






