from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import requests
import docker
from fastapi.responses import PlainTextResponse, JSONResponse, FileResponse
import time
import yaml
import pandas as pd
from datetime import datetime
import matplotlib.pyplot as plt
from pathlib import Path
import subprocess
from kafka import KafkaProducer, KafkaConsumer
import re
from cache.redis_manager import RedisCache
import asyncio
from typing import List
import aiohttp
import redis

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis cache
redis_cache = RedisCache()

# Kafka configuration
KAFKA_NODES = "kafka:9092"
CONTROL_TOPIC = "city-control"

# Global variables
dynamic_cities = []
is_ready = False  # Track if initial configuration is complete

# Initialize Docker client with improved error handling
def get_docker_client():
    try:
        # Try with default socket path
        client = docker.from_env()
        # Test connection
        client.ping()
        return client
    except Exception as e:
        # print(f"Failed to connect to Docker daemon using default socket: {str(e)}")
        pass
        
    # Try with explicit socket path
    try:
        socket_paths = [
            '/var/run/docker.sock',           # Standard Linux path
            '/run/docker.sock',               # Alternative Linux path
            '//./pipe/docker_engine',         # Windows path
            os.environ.get('DOCKER_HOST', '') # From environment variable
        ]
        
        for socket_path in socket_paths:
            if not socket_path:
                continue
                
            try:
                if socket_path.startswith('//./pipe'):
                    # Windows named pipe
                    client = docker.DockerClient(base_url=socket_path)
                else:
                    # Unix socket
                    client = docker.DockerClient(base_url=f"unix://{socket_path}")
                
                # Test connection
                client.ping()
                # print(f"Successfully connected to Docker daemon using {socket_path}")
                return client
            except Exception as socket_error:
                # print(f"Failed to connect using {socket_path}: {str(socket_error)}")
                continue
                
        # print("All attempts to connect to Docker daemon failed")
        return None
    except Exception as e:
        # print(f"Error setting up Docker client: {str(e)}")
        return None

# Initialize Kafka producer for control messages
def get_kafka_producer():
    return KafkaProducer(
        bootstrap_servers=KAFKA_NODES,
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )

# Initialize Kafka consumer for control messages
def get_kafka_consumer():
    return KafkaConsumer(
        CONTROL_TOPIC,
        bootstrap_servers=KAFKA_NODES,
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        auto_offset_reset='earliest',
        enable_auto_commit=True
    )

# Function to start control message consumer in a background thread
def start_control_consumer():
    def consume_messages():
        consumer = get_kafka_consumer()
        # print("[DEBUG] Started control message consumer")
        try:
            for message in consumer:
                try:
                    control_data = message.value
                    if control_data.get('action') == 'UPDATE_CITIES':
                        global dynamic_cities
                        new_cities = control_data.get('data', {}).get('cities', [])
                        dynamic_cities = new_cities
                        # print(f"[DEBUG] Updated dynamic cities list: {dynamic_cities}")
                except Exception as e:
                    # print(f"[ERROR] Error processing control message: {str(e)}")
                    pass
        except Exception as e:
            # print(f"[ERROR] Control consumer error: {str(e)}")
            pass

    import threading
    consumer_thread = threading.Thread(target=consume_messages, daemon=True)
    consumer_thread.start()

# Start the control consumer when the app starts
@app.on_event("startup")
async def startup_event():
    start_control_consumer()

# Function to update dynamic cities in configuration
def update_dynamic_cities(cities, is_first_batch):
    try:
        config_path = Path('configuration.yml')
        if config_path.exists():
            with open(config_path) as f:
                config = yaml.safe_load(f)
                
            # Update dynamic cities section
            if 'dynamicCities' not in config:
                config['dynamicCities'] = {}
            
            config['dynamicCities']['enabled'] = True
            if is_first_batch:
                config['dynamicCities']['previousBatch'] = []
            else:
                config['dynamicCities']['previousBatch'] = config['dynamicCities'].get('current', [])
            config['dynamicCities']['current'] = cities
            
            # Write updated config
            with open(config_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
                
            return True
    except Exception as e:
        # print(f"Error updating configuration: {str(e)}")
        pass
        return False

@app.get("/proxy/flink/logs/raw")
async def proxy_flink_raw_logs():
    """
    Proxy endpoint for raw logs from flink processor
    """
    # print("GET /proxy/flink/logs/raw called")
    
    # Try Docker client method
    client = get_docker_client()
    if client:
        try:
            container = client.containers.get("flink-processor")
            logs = container.logs(tail=2000).decode("utf-8")
            # print(f"Retrieved {len(logs)} bytes of logs directly from container")
            
            # Filter logs - include lines with various raw data patterns
            raw_logs = []
            for line in logs.split('\n'):
                if any(pattern in line for pattern in [
                    "Raw data received",
                    "Processing messages",
                    "Connected to Kafka",
                    "Connected to Zookeeper",
                    "Starting Flink job"
                ]):
                    raw_logs.append(line)
            
            filtered_logs = '\n'.join(raw_logs)
            # print(f"Filtered to {len(filtered_logs)} bytes of raw logs")
            return {"logs": filtered_logs if filtered_logs else ""}
        except Exception as e:
            # print(f"Error accessing flink processor container: {str(e)}")
            pass
            return {"logs": ""}
    
    # print("Docker client not available")
    return {"logs": ""}

@app.get("/proxy/flink/logs/db")
async def proxy_flink_db_logs():
    """
    Proxy endpoint for DB logs from flink processor
    """
    # print("GET /proxy/flink/logs/db called")
    
    # Try Docker client method
    client = get_docker_client()
    if client:
        try:
            container = client.containers.get("flink-processor")
            logs = container.logs(tail=2000).decode("utf-8")
            # print(f"Retrieved {len(logs)} bytes of logs directly from container")
            
            # Filter logs - include lines with various DB-related patterns
            db_logs = []
            for line in logs.split('\n'):
                if any(pattern in line for pattern in [
                    "Inserting into DB",
                    "Storing aggregated data",
                    "Connected to PostgreSQL",
                    "database connection"
                ]):
                    db_logs.append(line)
            
            filtered_logs = '\n'.join(db_logs)
            # print(f"Filtered to {len(filtered_logs)} bytes of DB logs")
            return {"logs": filtered_logs if filtered_logs else ""}
        except Exception as e:
            # print(f"Error accessing flink processor container: {str(e)}")
            return {"logs": ""}
    
    # print("Docker client not available")
    return {"logs": ""}

@app.get("/api/kafka-logs")
async def get_kafka_logs():
    # print("MY KAFKA LOGS: Endpoint /api/kafka-logs called")
    try:
        # print("MY KAFKA LOGS: Attempting to get Docker client")
        client = get_docker_client()
        if client:
            # print("MY KAFKA LOGS: Successfully got Docker client")
            try:
                # print("MY KAFKA LOGS: Attempting to get kafka-producer container")
                container = client.containers.get("kafka-producer")
                # print("MY KAFKA LOGS: Successfully got kafka-producer container")
                logs = container.logs(tail=3000).decode("utf-8")  # Limited to last 3000 lines for better performance
                # print(f"MY KAFKA LOGS: Retrieved {len(logs)} bytes of logs from container")
                
                # Parse logs to extract temperature data
                temperature_data = []
                raw_logs = []
                
                # Use the in-memory dynamic cities list
                # print(f"MY KAFKA LOGS: Found {len(dynamic_cities)} dynamic cities in memory")
                # print(f"MY KAFKA LOGS: Dynamic cities are: {dynamic_cities}")
                
                # print("MY KAFKA LOGS: First 10 lines of raw logs:")
                for i, line in enumerate(logs.split('\n')[:10]):
                    # print(f"MY KAFKA LOGS: Line {i}: {line}")
                    pass
                
                for line in logs.split('\n'):
                    raw_logs.append(line)
                    if "Sent data for" in line:
                        try:
                            # print(f"MY KAFKA LOGS: Processing line: {line}")
                            # Extract the JSON part after "Sent data for"
                            json_start = line.find('{')
                            if json_start != -1:
                                json_str = line[json_start:]
                                # print(f"MY KAFKA LOGS: Extracted JSON string: {json_str}")
                                try:
                                    data = json.loads(json_str)
                                    # print(f"MY KAFKA LOGS: Parsed JSON data: {data}")
                                    # print(f"MY KAFKA LOGS: JSON keys: {list(data.keys())}")
                                    
                                    # Only include dynamic cities
                                    if data.get('city') in dynamic_cities:
                                        # Extract timestamp from the log line
                                        timestamp_match = re.search(r'\[(.*?)\]', line)
                                        timestamp = timestamp_match.group(1) if timestamp_match else None
                                        
                                        if timestamp:
                                            temperature = data.get('temperatureCelsius')
                                            if temperature is not None:
                                                temperature_data.append({
                                                    'city': data['city'],
                                                    'temperature': float(temperature),
                                                    'timestamp': timestamp
                                                })
                                                # print(f"MY KAFKA LOGS: Added temperature data for {data['city']}: {temperature}°C at {timestamp}")
                                            else:
                                                # print(f"MY KAFKA LOGS: No temperatureCelsius found in data: {data}")
                                                pass
                                        else:
                                            # print(f"MY KAFKA LOGS: No timestamp found in line: {line}")
                                            pass
                                    else:
                                        # print(f"MY KAFKA LOGS: City {data.get('city')} not in dynamic cities list")
                                        pass
                                except json.JSONDecodeError as e:
                                    # print(f"MY KAFKA LOGS: JSON decode error: {str(e)}")
                                    # print(f"MY KAFKA LOGS: Problematic JSON string: {json_str}")
                                    pass
                            else:
                                # print(f"MY KAFKA LOGS: No JSON data found in line: {line}")
                                pass
                        except Exception as e:
                            # print(f"MY KAFKA LOGS: Error parsing log line: {str(e)}")
                            # print(f"MY KAFKA LOGS: Problematic line: {line}")
                            continue
                
                # print(f"MY KAFKA LOGS: Returning {len(temperature_data)} temperature data points")
                # print(f"MY KAFKA LOGS: Temperature data: {temperature_data}")
                return {
                    "logs": "\n".join(raw_logs),
                    "temperatureData": temperature_data,
                    "dynamicCities": dynamic_cities
                }
            except Exception as e:
                # print(f"MY KAFKA LOGS: Error accessing kafka-producer container: {str(e)}")
                return {"error": f"Error accessing kafka-producer container: {str(e)}"}
        else:
            # print("MY KAFKA LOGS: Failed to get Docker client")
            return {"error": "Docker client initialization failed"}
    except Exception as e:
        # print(f"MY KAFKA LOGS: Error in get_kafka_logs: {str(e)}")
        return {"error": str(e)}

# API routes that match frontend expectations
@app.get("/api/flink-logs/raw", response_class=PlainTextResponse)
async def api_flink_raw_logs():
    """
    Frontend-facing endpoint for Flink raw logs.
    Maps to /proxy/flink/logs/raw for consistency.
    """
    return await proxy_flink_raw_logs()

@app.get("/api/flink-logs/db", response_class=PlainTextResponse)
async def api_flink_db_logs():
    """
    Frontend-facing endpoint for Flink DB logs.
    Maps to /proxy/flink/logs/db for consistency.
    """
    return await proxy_flink_db_logs()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# New readiness endpoint
@app.get("/ready")
async def ready_check():
    return {"ready": is_ready}

# Add new endpoints for charts
# @app.get("/api/charts")
# async def get_charts():
#     try:
#         # Ensure directories exist
#         output_dir = Path('city-api/generated-artifacts')
#         csv_dir = output_dir / 'csvs'
#         chart_dir = output_dir / 'charts'
#         os.makedirs(chart_dir, exist_ok=True)
#         os.makedirs(csv_dir, exist_ok=True)
#
#         # Get cities from configuration
#         config_path = Path('configuration.yml')
#         if not config_path.exists():
#             return JSONResponse(
#                 content={"error": "Configuration file not found"},
#                 status_code=500
#             )
#
#         with open(config_path) as f:
#             config = yaml.safe_load(f)
#
#         cities = config.get('debugApi', {}).get('citiesPool', [])
#         if not cities:
#             return JSONResponse(
#                 content={"error": "No cities configured"},
#                 status_code=500
#             )
#
#         # Process data and generate charts
#         charts = []
#         chart_files = chart_dir.glob('*.png')
#         for chart_file in chart_files:
#             charts.append(f"/api/chart-images/{chart_file.name}")
#
#         return JSONResponse(content={"charts": charts})
#     except Exception as e:
#         return JSONResponse(
#             content={"error": str(e)},
#             status_code=500
#         )

@app.get("/api/chart-images/{filename}")
async def get_chart_image(filename: str):
    try:
        chart_path = Path('city-api/generated-artifacts/charts') / filename
        if not chart_path.exists():
            return JSONResponse(
                content={"error": "Chart not found"},
                status_code=404
            )

        return FileResponse(
            str(chart_path),
            media_type="image/png",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@app.get("/api/config")
async def get_config():
    try:
        config_path = Path('configuration.yml')
        if not config_path.exists():
            return JSONResponse(
                content={"error": "Configuration file not found"},
                status_code=500
            )

        with open(config_path) as f:
            config = yaml.safe_load(f)
        return JSONResponse(content=config)
    except Exception as e:
        # print(f"Error reading configuration: {str(e)}")
        return JSONResponse(
            content={"error": "Failed to read configuration"},
            status_code=500
        )

@app.post("/api/config")
async def update_config(request: Request):
    try:
        body = await request.json()
        config_path = Path('configuration.yml')
        
        # Read existing config
        if config_path.exists():
            with open(config_path) as f:
                config = yaml.safe_load(f)
        else:
            config = {}
            
        # Update config using the path
        path = body.get('path', '').split('.')
        current = config
        for part in path[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[path[-1]] = body.get('config')
        
        # Write updated config
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
            
        # Debug: Print the updated configuration
        # print("Updated configuration:")
        # with open(config_path) as f:
        #     print(f.read())

        # If we're updating dynamic cities, send a control message
        if path[0] == 'dynamicCities':
            try:
                producer = get_kafka_producer()
                new_cities = body.get('config', {}).get('current', [])
                control_message = {
                    'action': 'UPDATE_CITIES',
                    'data': {
                        'cities': new_cities
                    }
                }
                producer.send(CONTROL_TOPIC, value=control_message)
                producer.flush()
                # print(f"Sent UPDATE_CITIES control message with cities: {new_cities}")
            except Exception as e:
                # print(f"Error sending control message: {str(e)}")
                pass

        # Execute the equator chart script and capture its output
        script_path = Path('/app/city-api/equatorChart.sh')
        figure_json = None
        
        # print(f"Current working directory: {os.getcwd()}")
        # print(f"Looking for script at: {script_path.absolute()}")
        # print(f"Script exists: {script_path.exists()}")
        # print(f"Directory contents: {os.listdir('.')}")
        # print(f"city-api contents: {os.listdir('city-api')}")
        # print(f"File stats: {os.stat(script_path) if script_path.exists() else 'No stats'}")
        
        if script_path.exists():
            # print("Executing equator chart script...")
            try:
                # Make script executable
                # print("Setting executable permissions...")
                os.chmod('/app/city-api/equatorChart.sh', 0o755)
                # print(f"New file permissions: {os.stat('/app/city-api/equatorChart.sh').st_mode}")
                # Execute script and capture output
                # print("Running script...")
                # Try with sh explicitly
                result = subprocess.run(['/bin/sh', '/app/city-api/equatorChart.sh'], capture_output=True, text=True)
                # print(f"Script stdout: {result.stdout}")
                # print(f"Script stderr: {result.stderr}")
                
                # Extract figure JSON from output
                output = result.stdout
                if "FIGURE_JSON_START" in output and "FIGURE_JSON_END" in output:
                    json_str = output[output.find("FIGURE_JSON_START") + len("FIGURE_JSON_START"):output.find("FIGURE_JSON_END")].strip()
                    figure_json = json_str
                    # print("Successfully captured figure JSON")
                else:
                    # print("Could not find figure JSON in output")
                    pass
                
                if result.returncode != 0:
                    # print(f"Warning: equatorChart.sh exited with code {result.returncode}")
                    # print(f"Script stderr: {result.stderr}")
                    pass
            except Exception as e:
                # print(f"Error executing equator chart script: {str(e)}")
                pass
        else:
            # print(f"Warning: Script not found at {script_path}")
            pass
            
        return JSONResponse(content={
            "success": True,
            "figure": figure_json
        })
    except Exception as e:
        # print(f"Error updating configuration: {str(e)}")
        return JSONResponse(
            content={"error": "Failed to update configuration"},
            status_code=500
        )

@app.post("/api/selected-country")
async def receive_selected_country(request: Request):
    try:
        data = await request.json()
        country = data.get('country')
        # print(f"Processing request for country: {country}")

        # Try to get cached data
        cached_city_data = await redis_cache.get_city_data(country)
        cached_video_data = await redis_cache.get_video_data(country)

        if cached_city_data and cached_video_data:
            # print(f"Using cached data for {country}")
            return JSONResponse(content={
                "success": True,
                "country": country,
                "country_code": cached_city_data.get('country_code'),
                "cities": cached_city_data.get('cities', []),
                "capital_city_video_link": cached_video_data.get('video_url'),
                "capital_city_description": cached_video_data.get('description')
            })

        # If not cached, get fresh data
        # print(f"Getting fresh data for {country}")
        script_result = await execute_country_cities_script(country)
        
        if script_result.get('success'):
            # Cache the new data
            capital_city = script_result.get('cities', [{}])[0].get('city')
            
            await redis_cache.set_city_data(country, {
                'country': country,
                'country_code': script_result.get('country_code'),
                'cities': script_result.get('cities', [])
            })
            
            await redis_cache.set_video_data(country, {
                'country': country,
                'capital_city': capital_city,
                'video_url': script_result.get('capital_city_video_link'),
                'description': script_result.get('capital_city_description')
            })
            
            return JSONResponse(content=script_result)
        else:
            return JSONResponse(
                content={"error": "Failed to fetch country data"},
                status_code=500
            )
            
    except Exception as e:
        # print(f"Error processing request: {str(e)}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@app.post("/api/cache/clear")
async def clear_cache(request: Request):
    """Clear Redis cache"""
    try:
        data = await request.json()
        country = data.get('country')
        
        # Call Redis manager to clear cache
        redis_cache.clear_cache(country)
        
        print(f"REDIS_LOGS: Cache cleared for country: {country if country else 'ALL'}")
        return {"status": "success", "message": f"Cache cleared for {country if country else 'ALL'}"}
    except Exception as e:
        # print(f"Error clearing cache: {str(e)}")
        return {"status": "error", "message": str(e)}

# Get configuration helper function
def get_configuration():
    """Read and return the configuration from configuration.yml file"""
    try:
        config_path = Path('configuration.yml')
        if not config_path.exists():
            # print("Configuration file not found")
            return {}

        with open(config_path) as f:
            config = yaml.safe_load(f)
        return config
    except Exception as e:
        # print(f"Error reading configuration: {str(e)}")
        return {}

# Add the new function here
async def execute_country_cities_script(country: str) -> dict:
    """Execute the countryCities.sh script to fetch city data for a given country."""
    try:
        # Make the script executable
        script_path = '/app/city-api/countryCities.sh'
        os.chmod(script_path, 0o755)
        
        # Execute the script with the country as argument
        process = await asyncio.create_subprocess_exec(
            script_path,
            country,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            # print(f"Script execution failed with error: {stderr.decode()}")
            return {"success": False, "error": "Failed to fetch country data"}
            
        # Parse the JSON output
        try:
            result = json.loads(stdout.decode())
            return result
        except json.JSONDecodeError as e:
            # print(f"Failed to parse script output: {e}")
            return {"success": False, "error": "Failed to parse country data"}
            
    except Exception as e:
        # print(f"Error executing country cities script: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/api/city-coordinates/batch")
async def get_city_coordinates_batch(request: Request):
    """
    Batch endpoint to get coordinates for multiple cities at once.
    This endpoint accepts a list of city names and returns their coordinates.
    All data is retrieved from Redis, using both static and dynamic city collections.
    """
    try:
        # Parse request body
        data = await request.json()
        requested_cities = data.get("cities", [])
        
        if not requested_cities:
            return JSONResponse(
                status_code=400,
                content={"error": "No cities provided in request"}
            )
        
        # print(f"Processing batch request for {len(requested_cities)} cities")
        
        # Get city coordinates from Redis directly
        coordinates = {}
        redis_found = 0
        api_found = 0
        for city in requested_cities:
            # Get coordinates from Redis
            city_coords = await redis_cache.get_city_coordinates(city)
            if city_coords:
                coordinates[city] = city_coords
                redis_found += 1
            else:
                # If not found in Redis, attempt to get from external service as fallback
                city_coord = await get_city_coordinate(city)
                if city_coord:
                    print(f"REDIS_LOGS: Retrieved coordinates for '{city}' from external API - consider adding to Redis")
                    coordinates[city] = {
                        "lat": city_coord["latitude"],
                        "lng": city_coord["longitude"]
                    }
                    api_found += 1
        
        print(f"REDIS_LOGS: Batch coordinates summary: {redis_found} cities from Redis, {api_found} cities from external API")
        print(f"REDIS_LOGS: Returning coordinates for {len(coordinates)} cities")
        
        return JSONResponse(
            content={"coordinates": coordinates}
        )
    except Exception as e:
        # print(f"Error processing batch city coordinates request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to process city coordinates request"}
        )

@app.get("/api/static-city-coordinates")
async def get_static_city_coordinates():
    """
    Endpoint to get coordinates for all static cities configured in the system.
    This endpoint reads the city list from configuration.yml and returns
    coordinates for each city from Redis.
    """
    try:
        # Get list of static cities from configuration
        config = get_configuration()
        static_cities = config.get("cities", [])
        
        if not static_cities:
            return JSONResponse(
                content={"coordinates": {}}
            )
        
        # print(f"Processing static city coordinates for {len(static_cities)} cities")
        
        # Get coordinates for all static cities from Redis
        coordinates = {}
        redis_found = 0
        api_found = 0
        
        for city in static_cities:
            # Get coordinates directly from Redis
            city_coords = await redis_cache.get_city_coordinates(city)
            if city_coords:
                coordinates[city] = city_coords
                redis_found += 1
            else:
                # If not found in Redis, try to get from external API as fallback
                city_coord = await get_city_coordinate(city)
                if city_coord:
                    print(f"REDIS_LOGS: Retrieved coordinates for static city '{city}' from external API - consider adding to Redis")
                    coordinates[city] = {
                        "lat": city_coord["latitude"],
                        "lng": city_coord["longitude"]
                    }
                    api_found += 1
        
        print(f"REDIS_LOGS: Static coordinates summary: {redis_found} cities from Redis, {api_found} cities from external API")
        print(f"REDIS_LOGS: Returning static coordinates for {len(coordinates)} cities")
        
        return JSONResponse(
            content={"coordinates": coordinates}
        )
    except Exception as e:
        # print(f"Error processing static city coordinates request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to process static city coordinates request"}
        )

async def get_city_coordinate(city_name):
    """Get coordinates for a city from an external service (fallback method)"""
    try:
        # Call to geocoding service (replace with your preferred service)
        # This is just an example implementation - you may want to use a real geocoding API
        
        # First try to get from Nominatim
        city_name_encoded = city_name.replace(" ", "+")
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://nominatim.openstreetmap.org/search?q={city_name_encoded}&format=json&limit=1",
                headers={"User-Agent": "GlobalCityStreaming/1.0"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data and len(data) > 0:
                        # print(f"DEBUG: External API found coordinates for '{city_name}'")
                        return {
                            "latitude": float(data[0]["lat"]),
                            "longitude": float(data[0]["lon"])
                        }
        
        # print(f"DEBUG: External API could not find coordinates for city: {city_name}")
        return None
    except Exception as e:
        # print(f"Error getting coordinates for {city_name}: {str(e)}")
        return None

@app.get("/api/city-data/{country}")
async def get_city_data(country: str):
    """Get city data by country"""
    # Check cache first
    cached_data = await redis_cache.get_city_data(country)
    if cached_data:
        print(f"REDIS_LOGS: Cache hit for country: {country}")
        return cached_data
    
    # Not in cache, fetch from external API
    print(f"REDIS_LOGS: Cache miss for country: {country}. Fetching from external API...")
    
    try:
        async with aiohttp.ClientSession() as session:
            api_url = f"http://api.myweatherapi.com/v2/cities/{country}"
            # print(f"Fetching city data from: {api_url}")
            
            async with session.get(api_url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Cache the result
                    await redis_cache.set_city_data(country, data)
                    print(f"REDIS_LOGS: Stored city data for {country} in cache")
                    
                    return data
                else:
                    # print(f"External API returned status {response.status}")
                    return {"error": "External API error", "status": response.status}
    except Exception as e:
        # print(f"Error fetching city data: {str(e)}")
        return {"error": str(e)}

@app.get("/api/video-data/{country}")
async def get_video_data(country: str):
    """Get video data by country"""
    # Check cache first
    cached_data = await redis_cache.get_video_data(country)
    if cached_data:
        print(f"REDIS_LOGS: Cache hit for video data for country: {country}")
        return cached_data
    
    # Not in cache, fetch from external API
    print(f"REDIS_LOGS: Cache miss for video data for country: {country}. Fetching from external API...")
    
    try:
        async with aiohttp.ClientSession() as session:
            api_url = f"http://api.mycapitalvideos.com/v1/{country}"
            # print(f"Fetching video data from: {api_url}")
            
            async with session.get(api_url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Cache the result
                    await redis_cache.set_video_data(country, data)
                    print(f"REDIS_LOGS: Stored video data for {country} in cache")
                    
                    return data
                else:
                    # print(f"External video API returned status {response.status}")
                    return {"error": "External API error", "status": response.status}
    except Exception as e:
        # print(f"Error fetching video data: {str(e)}")
        return {"error": str(e)}

@app.get("/api/city-coordinates/{city_name}")
async def get_city_coordinates(city_name: str):
    """Get coordinates for a single city"""
    try:
        # Check Redis cache first
        coordinates = await redis_cache.get_city_coordinates(city_name)
        if coordinates:
            print(f"REDIS_LOGS: Using cached coordinates for {city_name}")
            return coordinates
        
        # Fall back to external service
        print(f"REDIS_LOGS: No cached coordinates for {city_name}, fetching from external service")
        coordinates = await get_city_coordinate(city_name)
        
        if coordinates:
            return coordinates
        else:
            return JSONResponse(
                status_code=404,
                content={"error": f"Could not find coordinates for {city_name}"}
            )
    except Exception as e:
        # print(f"Error getting coordinates for {city_name}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to get coordinates for {city_name}"}
        )