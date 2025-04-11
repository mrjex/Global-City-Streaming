import datetime
import time
import sys
import os
import threading
import queue
import json
import asyncio
import aiohttp
import yaml
from kafka import KafkaConsumer, KafkaProducer
from dotenv import load_dotenv
from shared.weather.api import WeatherAPI

# Add project root to Python path
sys.path.append("/app")
import utils

##  External pipeline configurations  ##
kafka_nodes = os.environ.get('KAFKA_SERVER', 'kafka:9092')
weather_topic = "weather-data"
control_topic = "city-control"

def log_message(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    print(log_entry, flush=True)

def load_cities_from_config():
    """Load cities from configuration.yml"""
    try:
        with open('/app/configuration.yml', 'r') as f:
            config = yaml.safe_load(f)
            
        # Get static cities
        static_cities = config.get('cities', [])
        
        # Get dynamic cities if enabled
        dynamic_cities = []
        if config.get('dynamicCities', {}).get('enabled', False):
            dynamic_cities = config.get('dynamicCities', {}).get('current', [])
            
        # Combine all cities
        all_cities = list(set(static_cities + dynamic_cities))
        log_message(f"Loaded {len(all_cities)} cities from configuration")
        return all_cities
    except Exception as e:
        log_message(f"Error loading cities from configuration: {str(e)}")
        return []

class WeatherProducer:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=kafka_nodes,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            api_version=(0, 10, 1)
        )
        self.weather_api = WeatherAPI()
        self.session = None
        self.cities = load_cities_from_config()
        self.cities_lock = threading.Lock()
        
        # Start control message consumer in a separate thread
        self.control_consumer_thread = threading.Thread(target=self._run_control_consumer)
        self.control_consumer_thread.daemon = True
        self.control_consumer_thread.start()

    def _run_control_consumer(self):
        """Run the control message consumer in a separate thread"""
        try:
            consumer = KafkaConsumer(
                control_topic,
                bootstrap_servers=kafka_nodes,
                value_deserializer=lambda x: json.loads(x.decode('utf-8')),
                api_version=(0, 10, 1)
            )
            
            log_message("Started control message consumer")
            
            for message in consumer:
                try:
                    control_data = message.value
                    if control_data.get('action') == 'UPDATE_CITIES':
                        new_cities = control_data.get('data', {}).get('cities', [])
                        with self.cities_lock:
                            self.cities = new_cities
                        log_message(f"Updated cities list from control message: {new_cities}")
                except Exception as e:
                    log_message(f"Error processing control message: {str(e)}")
                    
        except Exception as e:
            log_message(f"Control consumer error: {str(e)}")

    async def initialize(self):
        """Initialize the producer and create an aiohttp session"""
        self.session = aiohttp.ClientSession()
        if not self.cities:
            log_message("No cities loaded from configuration, using default list")
            with self.cities_lock:
                self.cities = [
                    "London", "New York", "Tokyo", "Paris", "Sydney",
                    "Berlin", "Moscow", "Dubai", "Singapore", "Rio de Janeiro"
                ]

    async def close(self):
        """Close the aiohttp session"""
        if self.session:
            await self.session.close()

    async def fetch_city_data(self, city: str) -> dict:
        """Fetch weather data for a single city asynchronously"""
        return await self.weather_api.fetch_city_data_async(city, self.session)

    async def process_cities_batch(self, cities: list) -> dict:
        """Process multiple cities concurrently"""
        tasks = [self.fetch_city_data(city) for city in cities]
        results = await asyncio.gather(*tasks)
        return {city: data for city, data in zip(cities, results) if data is not None}

    async def run(self, interval: int = None):
        """Main run loop"""
        try:
            await self.initialize()
            log_message(f"Starting high-frequency weather data producer for {len(self.cities)} cities")
            
            # Get interval from environment variable (in milliseconds)
            interval_ms = int(os.environ.get('PRODUCER_INTERVAL', 100))
            interval_sec = interval_ms / 1000.0
            
            while True:
                try:
                    start_time = datetime.datetime.now()
                    
                    # Get current cities list thread-safely
                    with self.cities_lock:
                        current_cities = self.cities.copy()
                    
                    # Process all cities concurrently
                    batch_results = await self.process_cities_batch(current_cities)
                    
                    # Create cycle data with timestamp
                    cycle_data = {
                        'timestamp': datetime.datetime.now().isoformat(),
                        'cities': batch_results
                    }
                    
                    # Log the entire cycle data
                    print(json.dumps(cycle_data, indent=2))
                    
                    # Send each city's data to Kafka
                    for city, data in batch_results.items():
                        if data:
                            try:
                                self.producer.send(weather_topic, value=data)
                                log_message(f"Sent data for {city}: {json.dumps(data)}")
                            except Exception as e:
                                log_message(f"Error sending data for {city}: {str(e)}")
                    
                    # Flush to ensure messages are sent
                    self.producer.flush()
                    
                    # Minimal sleep to prevent CPU overload
                    await asyncio.sleep(interval_sec)
                    
                except Exception as e:
                    log_message(f"Error in cycle: {str(e)}")
                    await asyncio.sleep(0.1)  # Brief pause on error
                
        except Exception as e:
            log_message(f"Fatal error in run loop: {str(e)}")
        finally:
            log_message("Shutting down producer")
            await self.close()
            self.producer.close()

async def main():
    producer = WeatherProducer()
    await producer.run()

if __name__ == "__main__":
    asyncio.run(main())