source .env

curl -s https://api.openai.com/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -d "{
        \"model\": \"gpt-3.5-turbo\",
        \"messages\": [{
          \"role\": \"user\",
          \"content\": \"Describe the capital city Stockholm of Sweden in 2-3 sentences, focusing on its unique architectural features, cultural significance, and any notable landmarks. Make it engaging and informative.\"
        }],
        \"temperature\": 0.7,
        \"max_tokens\": 150
      }"