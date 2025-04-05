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
        self.static_cities = set()  # Using sets to automatically handle duplicates
        self.dynamic_cities = set()
        self.is_first_batch = False
        self.cities_lock = threading.Lock()
        
    def get_all_cities(self):
        with self.cities_lock:
            # Combine sets and convert to list, automatically removing duplicates
            all_cities = list(self.static_cities | self.dynamic_cities)
            log_message(f"get_all_cities called - Static: {list(self.static_cities)}, Dynamic: {list(self.dynamic_cities)}, Combined: {all_cities}")
            return all_cities
            
    def update_dynamic_cities(self, new_cities, is_first_batch):
        with self.cities_lock:
            log_message(f"Updating dynamic cities - New cities: {new_cities}, Is first batch: {is_first_batch}")
            log_message(f"Before update - Static: {list(self.static_cities)}, Dynamic: {list(self.dynamic_cities)}")
            
            # Convert new cities to set to remove any duplicates within the new batch
            new_cities_set = set(new_cities)
            old_dynamic = self.dynamic_cities.copy()
            
            # Always update dynamic cities, but track if it's the first batch
            self.dynamic_cities = new_cities_set
            if is_first_batch:
                self.is_first_batch = True
                log_message("Marked as first batch of dynamic cities")
            
            # Log changes
            duplicates = new_cities_set & self.static_cities
            added_cities = new_cities_set - old_dynamic
            removed_cities = old_dynamic - new_cities_set
            
            if duplicates:
                log_message(f"Found duplicate cities (will be processed once): {duplicates}")
            if added_cities:
                log_message(f"Added new cities: {added_cities}")
            if removed_cities:
                log_message(f"Removed cities: {removed_cities}")
            
            log_message(f"After update - Static: {list(self.static_cities)}, Dynamic: {list(self.dynamic_cities)}")
            log_message(f"Final combined cities: {self.get_all_cities()}")

    def load_static_cities(self):
        with self.cities_lock:
            try:
                cities = utils.parseYmlFile("/app/configuration.yml", "cities")
                self.static_cities = set(cities)
                log_message(f"Loaded static cities: {list(self.static_cities)}")
            except Exception as e:
                log_message(f"Error loading static cities: {str(e)}")
                self.static_cities = set()

class CityUpdateConsumer:
    def __init__(self, city_manager):
        self.city_manager = city_manager
        self.consumer = KafkaConsumer(
            control_topic,
            bootstrap_servers=kafka_nodes,
            group_id='city-updater',
            enable_auto_commit=True,
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            auto_offset_reset='latest'
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
                        try:
                            self.city_manager.update_dynamic_cities(
                                data['data']['cities'],
                                data['data']['isFirstBatch']
                            )
                            log_message("Successfully processed city update")
                        except Exception as e:
                            log_message(f"Error processing city update: {str(e)}")
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
    while True:  # Outer loop for reconnection attempts
        try:
            prod = KafkaProducer(
                bootstrap_servers=kafka_nodes,
                value_serializer=lambda x: json.dumps(x).encode('utf-8')
            )
            log_message("Successfully connected to Kafka")

            while True:  # Inner loop for message production
                try:
                    # Get current list of all cities
                    cities = city_manager.get_all_cities()
                    log_message(f"Starting new processing cycle with {len(cities)} cities")
                    
                    if not cities:
                        log_message("No cities to process, waiting...")
                        time.sleep(request_interval)
                        continue
                    
                    # Process each city sequentially
                    for city in cities:
                        try:
                            city_data = next(weather_api.fetch_cities_batch([city]))
                            if city_data and city_data[1]:  # Check if we got valid data
                                message = {
                                    "city": city_data[0],
                                    "temperature": str(city_data[1]['temperatureCelsius'])
                                }
                                
                                prod.send(topic=weather_topic, value=message)
                                log_message(f"Sent data for {city}: {json.dumps(message)}")
                            else:
                                log_message(f"No data received for {city}, skipping")
                        except Exception as e:
                            log_message(f"Error processing city {city}: {str(e)}")
                            continue
                    
                    # Ensure messages are sent and wait before next cycle
                    prod.flush()
                    log_message("Completed processing cycle, waiting before next round")
                    time.sleep(request_interval)
                    
                except Exception as e:
                    log_message(f"Error in message production loop: {str(e)}")
                    log_message(f"Current cities state - Static: {list(city_manager.static_cities)}, Dynamic: {list(city_manager.dynamic_cities)}")
                    time.sleep(1)  # Wait before retrying
                    continue  # Continue inner loop instead of breaking
                    
        except Exception as e:
            log_message(f"Error with Kafka producer: {str(e)}")
            time.sleep(5)  # Wait before attempting to reconnect
            continue  # Continue outer loop to recreate producer
        finally:
            try:
                prod.close()
            except:
                pass  # Ignore errors during close

if __name__ == "__main__":
    main()