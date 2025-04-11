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

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kafka configuration
KAFKA_NODES = "kafka:9092"
CONTROL_TOPIC = "city-control"

# Global variable to store dynamic cities
dynamic_cities = []

# Initialize Docker client with improved error handling
def get_docker_client():
    try:
        # Try with default socket path
        client = docker.from_env()
        # Test connection
        client.ping()
        return client
    except Exception as e:
        print(f"Failed to connect to Docker daemon using default socket: {str(e)}")
        
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
                print(f"Successfully connected to Docker daemon using {socket_path}")
                return client
            except Exception as socket_error:
                print(f"Failed to connect using {socket_path}: {str(socket_error)}")
                continue
                
        print("All attempts to connect to Docker daemon failed")
        return None
    except Exception as e:
        print(f"Error setting up Docker client: {str(e)}")
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
        print("[DEBUG] Started control message consumer")
        try:
            for message in consumer:
                try:
                    control_data = message.value
                    if control_data.get('action') == 'UPDATE_CITIES':
                        global dynamic_cities
                        new_cities = control_data.get('data', {}).get('cities', [])
                        dynamic_cities = new_cities
                        print(f"[DEBUG] Updated dynamic cities list: {dynamic_cities}")
                except Exception as e:
                    print(f"[ERROR] Error processing control message: {str(e)}")
        except Exception as e:
            print(f"[ERROR] Control consumer error: {str(e)}")
    
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
        print(f"Error updating configuration: {str(e)}")
        return False

@app.get("/proxy/flink/logs/raw")
async def proxy_flink_raw_logs():
    """
    Proxy endpoint for raw logs from flink processor
    """
    print("GET /proxy/flink/logs/raw called")
    
    # Try Docker client method
    client = get_docker_client()
    if client:
        try:
            container = client.containers.get("flink-processor")
            logs = container.logs(tail=2000).decode("utf-8")
            print(f"Retrieved {len(logs)} bytes of logs directly from container")
            
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
            print(f"Filtered to {len(filtered_logs)} bytes of raw logs")
            return {"logs": filtered_logs if filtered_logs else ""}
        except Exception as e:
            print(f"Error accessing flink processor container: {str(e)}")
            return {"logs": ""}
    
    print("Docker client not available")
    return {"logs": ""}

@app.get("/proxy/flink/logs/db")
async def proxy_flink_db_logs():
    """
    Proxy endpoint for DB logs from flink processor
    """
    print("GET /proxy/flink/logs/db called")
    
    # Try Docker client method
    client = get_docker_client()
    if client:
        try:
            container = client.containers.get("flink-processor")
            logs = container.logs(tail=2000).decode("utf-8")
            print(f"Retrieved {len(logs)} bytes of logs directly from container")
            
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
            print(f"Filtered to {len(filtered_logs)} bytes of DB logs")
            return {"logs": filtered_logs if filtered_logs else ""}
        except Exception as e:
            print(f"Error accessing flink processor container: {str(e)}")
            return {"logs": ""}
    
    print("Docker client not available")
    return {"logs": ""}

@app.get("/api/kafka-logs")
async def get_kafka_logs():
    print("MY KAFKA LOGS: Endpoint /api/kafka-logs called")
    try:
        print("MY KAFKA LOGS: Attempting to get Docker client")
        client = get_docker_client()
        if client:
            print("MY KAFKA LOGS: Successfully got Docker client")
            try:
                print("MY KAFKA LOGS: Attempting to get kafka-producer container")
                container = client.containers.get("kafka-producer")
                print("MY KAFKA LOGS: Successfully got kafka-producer container")
                logs = container.logs(tail=3000).decode("utf-8")  # Limited to last 3000 lines for better performance
                print(f"MY KAFKA LOGS: Retrieved {len(logs)} bytes of logs from container")
                
                # Parse logs to extract temperature data
                temperature_data = []
                raw_logs = []
                
                # Use the in-memory dynamic cities list
                print(f"MY KAFKA LOGS: Found {len(dynamic_cities)} dynamic cities in memory")
                print(f"MY KAFKA LOGS: Dynamic cities are: {dynamic_cities}")
                
                print("MY KAFKA LOGS: First 10 lines of raw logs:")
                for i, line in enumerate(logs.split('\n')[:10]):
                    print(f"MY KAFKA LOGS: Line {i}: {line}")
                
                for line in logs.split('\n'):
                    raw_logs.append(line)
                    if "Sent data for" in line:
                        try:
                            print(f"MY KAFKA LOGS: Processing line: {line}")
                            # Extract the JSON part after "Sent data for"
                            json_start = line.find('{')
                            if json_start != -1:
                                json_str = line[json_start:]
                                print(f"MY KAFKA LOGS: Extracted JSON string: {json_str}")
                                try:
                                    data = json.loads(json_str)
                                    print(f"MY KAFKA LOGS: Parsed JSON data: {data}")
                                    print(f"MY KAFKA LOGS: JSON keys: {list(data.keys())}")
                                    
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
                                                print(f"MY KAFKA LOGS: Added temperature data for {data['city']}: {temperature}°C at {timestamp}")
                                            else:
                                                print(f"MY KAFKA LOGS: No temperatureCelsius found in data: {data}")
                                        else:
                                            print(f"MY KAFKA LOGS: No timestamp found in line: {line}")
                                    else:
                                        print(f"MY KAFKA LOGS: City {data.get('city')} not in dynamic cities list")
                                except json.JSONDecodeError as e:
                                    print(f"MY KAFKA LOGS: JSON decode error: {str(e)}")
                                    print(f"MY KAFKA LOGS: Problematic JSON string: {json_str}")
                            else:
                                print(f"MY KAFKA LOGS: No JSON data found in line: {line}")
                        except Exception as e:
                            print(f"MY KAFKA LOGS: Error parsing log line: {str(e)}")
                            print(f"MY KAFKA LOGS: Problematic line: {line}")
                            continue
                
                print(f"MY KAFKA LOGS: Returning {len(temperature_data)} temperature data points")
                print(f"MY KAFKA LOGS: Temperature data: {temperature_data}")
                return {
                    "logs": "\n".join(raw_logs),
                    "temperatureData": temperature_data,
                    "dynamicCities": dynamic_cities
                }
            except Exception as e:
                print(f"MY KAFKA LOGS: Error accessing kafka-producer container: {str(e)}")
                return {"error": f"Error accessing kafka-producer container: {str(e)}"}
        else:
            print("MY KAFKA LOGS: Failed to get Docker client")
            return {"error": "Docker client initialization failed"}
    except Exception as e:
        print(f"MY KAFKA LOGS: Error in get_kafka_logs: {str(e)}")
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
        print(f"Error reading configuration: {str(e)}")
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
        print("Updated configuration:")
        with open(config_path) as f:
            print(f.read())

        # Execute the equator chart script and capture its output
        script_path = Path('/app/city-api/equatorChart.sh')
        figure_json = None
        
        print(f"Current working directory: {os.getcwd()}")
        print(f"Looking for script at: {script_path.absolute()}")
        print(f"Script exists: {script_path.exists()}")
        print(f"Directory contents: {os.listdir('.')}")
        print(f"city-api contents: {os.listdir('city-api')}")
        print(f"File stats: {os.stat(script_path) if script_path.exists() else 'No stats'}")
        
        if script_path.exists():
            print("Executing equator chart script...")
            try:
                # Make script executable
                print("Setting executable permissions...")
                os.chmod('/app/city-api/equatorChart.sh', 0o755)
                print(f"New file permissions: {os.stat('/app/city-api/equatorChart.sh').st_mode}")
                # Execute script and capture output
                print("Running script...")
                # Try with sh explicitly
                result = subprocess.run(['/bin/sh', '/app/city-api/equatorChart.sh'], capture_output=True, text=True)
                print(f"Script stdout: {result.stdout}")
                print(f"Script stderr: {result.stderr}")
                
                # Extract figure JSON from output
                output = result.stdout
                if "FIGURE_JSON_START" in output and "FIGURE_JSON_END" in output:
                    json_str = output[output.find("FIGURE_JSON_START") + len("FIGURE_JSON_START"):output.find("FIGURE_JSON_END")].strip()
                    figure_json = json_str
                    print("Successfully captured figure JSON")
                else:
                    print("Could not find figure JSON in output")
                
                if result.returncode != 0:
                    print(f"Warning: equatorChart.sh exited with code {result.returncode}")
                    print(f"Script stderr: {result.stderr}")
            except Exception as e:
                print(f"Error executing equator chart script: {str(e)}")
        else:
            print(f"Warning: Script not found at {script_path}")
            
        return JSONResponse(content={
            "success": True,
            "figure": figure_json
        })
    except Exception as e:
        print(f"Error updating configuration: {str(e)}")
        return JSONResponse(
            content={"error": "Failed to update configuration"},
            status_code=500
        )

@app.post("/api/selected-country")
async def receive_selected_country(request: Request):
    try:
        data = await request.json()
        country = data.get('country')
        print(f"[DEBUG] Processing country: {country}", flush=True)

        script_path = Path('/app/city-api/countryCities.sh')
        if not script_path.exists():
            print(f"[ERROR] Script not found at {script_path}", flush=True)
            return JSONResponse(content={"error": "Script not found"}, status_code=500)
        
        try:
            # Make script executable
            print("[DEBUG] Setting script permissions...", flush=True)
            os.chmod(script_path, 0o755)
            
            # Execute script with environment variables
            script_env = os.environ.copy()
            script_env.update({
                "GEODB_CITIES_API_KEY": os.environ.get("GEODB_CITIES_API_KEY", ""),
                "WEATHER_API_KEY": os.environ.get("WEATHER_API_KEY", "")
            })
            
            print("[DEBUG] Executing script...", flush=True)
            result = subprocess.run(
                ['/bin/bash', str(script_path), country],
                capture_output=True,
                text=True,
                env=script_env
            )
            
            print("[DEBUG] Script stdout:", flush=True)
            print(result.stdout, flush=True)
            print("[DEBUG] Script stderr:", flush=True)
            print(result.stderr, flush=True)
            
            if result.returncode != 0:
                print(f"[ERROR] Script failed with return code {result.returncode}", flush=True)
                return JSONResponse(
                    content={"error": "Failed to process country"},
                    status_code=500
                )

            # Parse the script output
            try:
                response_data = json.loads(result.stdout)
                print(f"[DEBUG] Parsed response data: {json.dumps(response_data, indent=2)}", flush=True)
                
                # Extract cities from response
                if response_data.get('success') and 'cities' in response_data:
                    # Debug log the cities structure
                    print("[DEBUG] Cities data structure:", flush=True)
                    for city in response_data['cities']:
                        print(f"City object: {json.dumps(city)}", flush=True)
                    
                    try:
                        # Extract city names, with better error handling
                        cities = []
                        for city in response_data['cities']:
                            if isinstance(city, dict) and 'city' in city:  # Check if it's a dict and has 'city' key
                                cities.append(city['city'])
                            else:
                                print(f"[WARNING] Unexpected city format: {city}", flush=True)
                        
                        if not cities:
                            print("[WARNING] No valid cities found in response", flush=True)
                            return JSONResponse(content=response_data)
                        
                        print(f"[DEBUG] Extracted city names: {cities}", flush=True)
                        
                        # Check if this is the first batch
                        config_path = Path('configuration.yml')
                        is_first_batch = True
                        if config_path.exists():
                            with open(config_path) as f:
                                config = yaml.safe_load(f)
                                is_first_batch = not config.get('dynamicCities', {}).get('enabled', False)
                        
                        # Update configuration file
                        if update_dynamic_cities(cities, is_first_batch):
                            # Send update to control topic
                            try:
                                producer = get_kafka_producer()
                                control_message = {
                                    'action': 'UPDATE_CITIES',
                                    'data': {
                                        'cities': cities,
                                        'isFirstBatch': is_first_batch
                                    }
                                }
                                producer.send(CONTROL_TOPIC, control_message)
                                producer.flush()
                                producer.close()
                                print(f"[DEBUG] Sent control message: {control_message}", flush=True)
                            except Exception as e:
                                print(f"[ERROR] Failed to send control message: {str(e)}", flush=True)
                    except Exception as e:
                        print(f"[ERROR] Error processing city data: {str(e)}", flush=True)
                        print(f"[DEBUG] Cities data: {response_data['cities']}", flush=True)
                        return JSONResponse(
                            content={"error": f"Error processing city data: {str(e)}"},
                            status_code=500
                        )
                
                return JSONResponse(content=response_data)
            except json.JSONDecodeError as e:
                print(f"[ERROR] Failed to parse JSON output: {str(e)}", flush=True)
                print(f"[DEBUG] Raw output: {result.stdout}", flush=True)
                return JSONResponse(
                    content={"error": "Failed to parse script output"},
                    status_code=500
                )
        except Exception as e:
            print(f"Error executing script: {str(e)}", flush=True)
            return JSONResponse(
                content={"error": str(e)},
                status_code=500
            )
    except Exception as e:
        print(f"Error processing request: {str(e)}", flush=True)
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )