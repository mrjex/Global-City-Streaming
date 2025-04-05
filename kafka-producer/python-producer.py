import datetime
import time
import schedule
import requests
import sys
import os
from pathlib import Path
import json
import random
from json import dumps
from kafka import KafkaProducer
import glob
from dotenv import load_dotenv

# Add project root to Python path
sys.path.append("/app")
import utils

##  External pipeline configurations  ##
kafka_nodes = "kafka:9092"
myTopic = "weather"

## Weather API configurations  ##
load_dotenv()  # Load environment variables from .env file
apiKey = os.getenv('WEATHER_API_KEY')
apiUrl = "https://api.weatherapi.com/v1/current.json"

# Get configuration values from YAML
cities = utils.parseYmlFile("/app/configuration.yml", "cities")
request_interval = utils.parseYmlFile("/app/configuration.yml", "services.kafkaProducer.requestInterval")

def log_message(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    print(log_entry)  # This will go to container's logs

def fetch_api_data(city):
    query = {'key': apiKey, 'q': city, 'aqi':'yes'}
    response = requests.get(apiUrl, params=query)
    body_dict = response.json()
    temperature = body_dict['current']['temp_c']
    return temperature

def main():
    log_message("Starting Kafka producer...")
    log_message("Connected to Kafka broker")
    log_message(f"Using request interval: {request_interval} seconds")

    # Create producer once outside the loop
    prod = KafkaProducer(
        bootstrap_servers=kafka_nodes,
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )

    while True:
        try:
            for city in cities:
                temperature = round(random.uniform(-10, 40), 2) # TODO: Replace with actual temperature from API
                data = {
                    "city": city,
                    "temperature": str(temperature)
                }
                
                prod.send(topic=myTopic, value=data)
                log_message(f"Sent data: {json.dumps(data)}")
                time.sleep(request_interval)  # Use the interval from configuration
            
        except Exception as e:
            log_message(f"Error in main loop: {str(e)}")
            
    # Only close producer if we break out of the loop
    prod.close()

if __name__ == "__main__":
    main()