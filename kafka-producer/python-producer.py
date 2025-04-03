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
idleTime = 0.5 # Default: 0.5
intervalTime = 3 # Default: 3

# Cities to analyize and take real-time samples of in the kafka-to-flink pipeline.
# Note that this array of cities must be identical to the local city array declared
# in "/debug-api/charts/real-time-multi-samples" in 'bubble-chart.py' and
# 'pie-chart.py'
cities = utils.parseYmlFile("/app/configuration.yml", "realTimeProduction.cities")

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

    while True:
        try:
            for city in cities:
                temperature = round(random.uniform(-10, 40), 2)
                data = {
                    "city": city,
                    "temperature": str(temperature)
                }
                
                prod = KafkaProducer(bootstrap_servers=kafka_nodes, value_serializer=lambda x: json.dumps(x).encode('utf-8'))
                prod.send(topic=myTopic, value=data)
                log_message(f"Sent data: {json.dumps(data)}")
                prod.close()
            
            time.sleep(1)
        except Exception as e:
            log_message(f"Error in main loop: {str(e)}")
            time.sleep(1)

if __name__ == "__main__":
    main()