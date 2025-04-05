import datetime
import time
import schedule
import sys
import os
from pathlib import Path
import json
from kafka import KafkaProducer
from dotenv import load_dotenv

# Add project root to Python path
sys.path.append("/app")
import utils
from shared.weather import WeatherAPI

##  External pipeline configurations  ##
kafka_nodes = "kafka:9092"
myTopic = "weather"

## Load configuration ##
load_dotenv()  # Load environment variables from .env file
cities = utils.parseYmlFile("/app/configuration.yml", "cities")
request_interval = utils.parseYmlFile("/app/configuration.yml", "services.kafkaProducer.requestInterval")

def log_message(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    print(log_entry)  # This will go to container's logs

def main():
    log_message("Starting Kafka producer...")
    log_message("Connected to Kafka broker")
    log_message(f"Using request interval: {request_interval} seconds")

    # Initialize WeatherAPI
    try:
        weather_api = WeatherAPI()
    except ValueError as e:
        log_message(f"Failed to initialize WeatherAPI: {str(e)}")
        return

    # Create producer once outside the loop
    prod = KafkaProducer(
        bootstrap_servers=kafka_nodes,
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )

    while True:
        try:
            # Fetch all cities in one batch
            city_data = weather_api.fetch_cities_batch(cities)
            
            # Send data for each city
            for city, data in city_data.items():
                if data:  # Only send if we got valid data
                    message = {
                        "city": city,
                        "temperature": str(data['temperatureCelsius'])
                    }
                    
                    prod.send(topic=myTopic, value=message)
                    log_message(f"Sent data: {json.dumps(message)}")
                
            time.sleep(request_interval)  # Wait before next batch
            
        except Exception as e:
            log_message(f"Error in main loop: {str(e)}")
            time.sleep(1)  # Wait a bit before retrying
            
    # Only close producer if we break out of the loop
    prod.close()

if __name__ == "__main__":
    main()