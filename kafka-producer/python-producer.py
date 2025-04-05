import datetime
import time
import schedule
import sys
import os
import threading
from pathlib import Path
import json
from kafka import KafkaProducer, KafkaConsumer
from dotenv import load_dotenv

# Add project root to Python path
sys.path.append("/app")
import utils
from shared.weather import WeatherAPI

##  External pipeline configurations  ##
kafka_nodes = "kafka:9092"
weather_topic = "weather"
control_topic = "city-control"

class CityManager:
    def __init__(self):
        self.static_cities = []  # Cities from configuration.yml
        self.dynamic_cities = []  # Dynamically added cities
        self.is_first_batch = False
        self.cities_lock = threading.Lock()
        
    def get_all_cities(self):
        with self.cities_lock:
            return self.static_cities + self.dynamic_cities
            
    def update_dynamic_cities(self, new_cities, is_first_batch):
        with self.cities_lock:
            if is_first_batch and not self.is_first_batch:
                self.dynamic_cities = new_cities
                self.is_first_batch = True
            elif self.is_first_batch:
                # Replace existing dynamic cities
                self.dynamic_cities = new_cities
            log_message(f"Updated dynamic cities. Current cities: {self.get_all_cities()}")

    def load_static_cities(self):
        with self.cities_lock:
            self.static_cities = utils.parseYmlFile("/app/configuration.yml", "cities")
            log_message(f"Loaded static cities: {self.static_cities}")

class CityUpdateConsumer:
    def __init__(self, city_manager):
        self.city_manager = city_manager
        self.consumer = KafkaConsumer(
            control_topic,
            bootstrap_servers=kafka_nodes,
            group_id='city-updater',
            enable_auto_commit=True,
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )
        self.running = False
        self.thread = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self.listen_for_updates)
        self.thread.daemon = True
        self.thread.start()
        log_message("Started city update consumer")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        self.consumer.close()
        log_message("Stopped city update consumer")

    def listen_for_updates(self):
        log_message("Listening for city updates on control topic...")
        while self.running:
            try:
                for message in self.consumer:
                    if not self.running:
                        break
                    
                    data = message.value
                    if data.get('action') == 'UPDATE_CITIES':
                        log_message(f"Received city update: {data}")
                        self.city_manager.update_dynamic_cities(
                            data['data']['cities'],
                            data['data']['isFirstBatch']
                        )
            except Exception as e:
                log_message(f"Error in consumer thread: {str(e)}")
                time.sleep(1)  # Wait before retrying

def log_message(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    print(log_entry, flush=True)  # This will go to container's logs

def main():
    log_message("Starting Kafka producer...")
    
    # Initialize city manager and load static cities
    city_manager = CityManager()
    city_manager.load_static_cities()
    
    # Initialize and start the control topic consumer
    consumer = CityUpdateConsumer(city_manager)
    consumer.start()
    
    # Load configuration
    load_dotenv()
    request_interval = utils.parseYmlFile("/app/configuration.yml", "services.kafkaProducer.requestInterval")
    log_message(f"Using request interval: {request_interval} seconds")

    try:
        weather_api = WeatherAPI()
    except ValueError as e:
        log_message(f"Failed to initialize WeatherAPI: {str(e)}")
        consumer.stop()
        return

    # Create producer
    prod = KafkaProducer(
        bootstrap_servers=kafka_nodes,
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )

    try:
        while True:
            try:
                # Get current list of all cities
                cities = city_manager.get_all_cities()
                
                # Process each city sequentially
                for city, data in weather_api.fetch_cities_batch(cities):
                    if data:  # Only send if we got valid data
                        message = {
                            "city": city,
                            "temperature": str(data['temperatureCelsius'])
                        }
                        
                        prod.send(topic=weather_topic, value=message)
                        log_message(f"Sent data for {city}: {json.dumps(message)}")
                    else:
                        log_message(f"No data received for {city}, skipping")
                    
                time.sleep(request_interval)  # Wait before next round
                
            except Exception as e:
                log_message(f"Error in main loop: {str(e)}")
                time.sleep(1)  # Wait before retrying
                
    except KeyboardInterrupt:
        log_message("Shutting down...")
    finally:
        consumer.stop()
        prod.close()

if __name__ == "__main__":
    main()