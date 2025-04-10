import datetime
import time
import sys
import os
import threading
import queue
import json
from kafka import KafkaConsumer, KafkaProducer
from dotenv import load_dotenv

# Add project root to Python path
sys.path.append("/app")
import utils
from shared.weather import WeatherAPI

##  External pipeline configurations  ##
kafka_nodes = "kafka:9092"
weather_topic = "weather"
control_topic = "city-control"

def log_message(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    print(log_entry, flush=True)

class CityManager:
    def __init__(self):
        self.static_cities = set()
        self.dynamic_cities = set()
        self.cities_lock = threading.Lock()
        self.update_event = threading.Event()  # Event to signal updates
        
    def get_all_cities(self):
        with self.cities_lock:
            all_cities = list(self.static_cities | self.dynamic_cities)
            log_message(f"Current cities - Static: {list(self.static_cities)}, Dynamic: {list(self.dynamic_cities)}, Combined: {all_cities}")
            return all_cities
            
    def update_cities(self, new_cities):
        """Update dynamic cities list"""
        with self.cities_lock:
            old_cities = self.dynamic_cities.copy()
            self.dynamic_cities = set(new_cities)
            
            added = self.dynamic_cities - old_cities
            removed = old_cities - self.dynamic_cities
            unchanged = old_cities & self.dynamic_cities
            
            if added:
                log_message(f"Added cities: {added}")
            if removed:
                log_message(f"Removed cities: {removed}")
            if unchanged:
                log_message(f"Unchanged cities: {unchanged}")
                
            # Signal that an update occurred
            self.update_event.set()

    def load_static_cities(self):
        try:
            cities = utils.parseYmlFile("/app/configuration.yml", "cities")
            with self.cities_lock:
                self.static_cities = set(cities)
            log_message(f"Loaded static cities: {list(self.static_cities)}")
        except Exception as e:
            log_message(f"Error loading static cities: {str(e)}")
            self.static_cities = set()

class CityUpdateConsumer(threading.Thread):
    def __init__(self, city_manager):
        super().__init__(daemon=True)
        self.city_manager = city_manager
        self.running = False
        self.consumer = None
        
    def run(self):
        self.running = True
        while self.running:
            try:
                if not self.consumer:
                    self.consumer = KafkaConsumer(
                        control_topic,
                        bootstrap_servers=kafka_nodes,
                        group_id='city-updater',
                        enable_auto_commit=True,
                        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
                        auto_offset_reset='latest',
                        consumer_timeout_ms=1000
                    )
                    log_message("Connected to Kafka consumer")
                
                messages = self.consumer.poll(timeout_ms=1000)
                for topic_partition, msgs in messages.items():
                    for message in msgs:
                        if not self.running:
                            break
                            
                        try:
                            data = message.value
                            if data.get('action') == 'UPDATE_CITIES':
                                log_message(f"Received city update: {data}")
                                new_cities = data['data']['cities']
                                self.city_manager.update_cities(new_cities)
                        except Exception as e:
                            log_message(f"Error processing message: {str(e)}")
                            continue
                            
            except Exception as e:
                log_message(f"Consumer error: {str(e)}")
                if self.consumer:
                    try:
                        self.consumer.close()
                    except:
                        pass
                    self.consumer = None
                time.sleep(1)
    
    def stop(self):
        self.running = False
        if self.consumer:
            try:
                self.consumer.close()
            except:
                pass

class WeatherProducer:
    def __init__(self, city_manager):
        self.city_manager = city_manager
        self.producer = None
        self.weather_api = None
        self.running = False
        self.batch_mode = True  # Default to batch mode
        
    def initialize(self):
        try:
            self.weather_api = WeatherAPI()
            # Enable batch mode in the WeatherAPI
            self.weather_api.batch_enabled = self.batch_mode
            return True
        except Exception as e:
            log_message(f"Failed to initialize WeatherAPI: {str(e)}")
            return False
            
    def connect(self):
        try:
            if self.producer:
                self.producer.close()
                
            self.producer = KafkaProducer(
                bootstrap_servers=kafka_nodes,
                value_serializer=lambda x: json.dumps(x).encode('utf-8'),
                acks='all',
                request_timeout_ms=5000,
                max_block_ms=5000
            )
            log_message("Connected to Kafka producer")
            return True
        except Exception as e:
            log_message(f"Producer connection error: {str(e)}")
            return False
            
    def run(self):
        if not self.initialize() or not self.connect():
            return
            
        self.running = True
        last_heartbeat = time.time()
        request_interval = float(utils.parseYmlFile("/app/configuration.yml", "services.kafkaProducer.requestInterval"))
        
        while self.running:
            try:
                current_time = time.time()
                if current_time - last_heartbeat >= 60:
                    log_message("Producer heartbeat - still running")
                    last_heartbeat = current_time
                
                # Get current cities
                cities = self.city_manager.get_all_cities()
                if not cities:
                    time.sleep(request_interval)
                    continue
                    
                log_message(f"Processing {len(cities)} cities")
                
                if self.batch_mode:
                    # Batch mode: process all cities at once
                    try:
                        # Fetch all cities in one batch
                        batch_results = self.weather_api.fetch_cities_batch(cities)
                        
                        # Process results and send to Kafka
                        for city, data in batch_results.items():
                            if data:
                                message = {
                                    "city": city,
                                    "temperature": str(data['temperatureCelsius'])
                                }
                                
                                future = self.producer.send(weather_topic, message)
                                future.get(timeout=5)
                                log_message(f"Sent data for {city}: {json.dumps(message)}")
                            else:
                                log_message(f"No data for {city}")
                    except Exception as e:
                        log_message(f"Error processing batch: {str(e)}")
                else:
                    # Sequential mode: process each city individually
                    for city in cities:
                        try:
                            city_data = next(self.weather_api.fetch_cities_batch([city]))
                            if city_data and city_data[1]:
                                message = {
                                    "city": city_data[0],
                                    "temperature": str(city_data[1]['temperatureCelsius'])
                                }
                                
                                future = self.producer.send(weather_topic, message)
                                future.get(timeout=5)
                                log_message(f"Sent data for {city}: {json.dumps(message)}")
                            else:
                                log_message(f"No data for {city}")
                        except Exception as e:
                            log_message(f"Error processing {city}: {str(e)}")
                            continue
                
                self.producer.flush(timeout=5)
                log_message("Completed processing cycle")
                time.sleep(request_interval)
                
            except Exception as e:
                log_message(f"Producer error: {str(e)}")
                if not self.connect():  # Try to reconnect
                    time.sleep(5)
    
    def stop(self):
        self.running = False
        if self.producer:
            try:
                self.producer.close()
            except:
                pass

def main():
    log_message("Starting weather data producer...")
    
    # Initialize components
    city_manager = CityManager()
    city_manager.load_static_cities()
    
    # Start consumer thread
    consumer = CityUpdateConsumer(city_manager)
    consumer.start()
    
    # Create and run producer
    producer = WeatherProducer(city_manager)
    
    try:
        producer.run()
    except KeyboardInterrupt:
        log_message("Shutting down...")
    finally:
        producer.stop()
        consumer.stop()
        consumer.join(timeout=5)

if __name__ == "__main__":
    main()