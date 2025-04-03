from fastapi import FastAPI, Query
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

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/test-flink-connection")
async def test_flink_connection():
    """
    Test endpoint to verify connectivity to the flink-processor container
    """
    print("Testing connection to flink-processor")
    result = {
        "status": "Testing connection",
        "tests": []
    }
    
    # Environment information
    env_info = {
        "environment_variables": {
            "FLINK_PROCESSOR_URL": os.environ.get("FLINK_PROCESSOR_URL", "Not set"),
            "NODE_ENV": os.environ.get("NODE_ENV", "Not set"),
            "HOSTNAME": os.environ.get("HOSTNAME", "Not set")
        }
    }
    result["environment"] = env_info
    
    try:
        # Use docker client to check container status
        client = get_docker_client()
        if client:
            try:
                container = client.containers.get("flink-processor")
                container_info = client.api.inspect_container(container.id)
                container_status = container_info['State']['Status']
                container_health = container_info['State'].get('Health', {}).get('Status', 'N/A')
                ip_address = container_info['NetworkSettings']['Networks']['app_network']['IPAddress']
                
                result["container_info"] = {
                    "id": container.id,
                    "status": container_status,
                    "health": container_health,
                    "ip": ip_address,
                    "running": container.status == "running"
                }
            except Exception as e:
                result["container_info"] = {
                    "error": f"Could not get flink-processor container info: {str(e)}"
                }
        else:
            result["docker_client_error"] = "Failed to initialize Docker client"
            
        # Since we now use Docker client directly, we don't need HTTP tests anymore
        # Let's just check if we can get logs directly
        try:
            client = get_docker_client()
            if client:
                container = client.containers.get("flink-processor")
                logs = container.logs(tail=10).decode("utf-8")
                
                result["logs_test"] = {
                    "success": True,
                    "log_preview": logs[:200] if logs else "No logs found",
                    "log_length": len(logs)
                }
            else:
                result["logs_test"] = {
                    "success": False,
                    "error": "Docker client not available"
                }
        except Exception as e:
            result["logs_test"] = {
                "success": False,
                "error": str(e)
            }
            
        # Try HTTP connection as fallback
        try:
            hostname = "flink-processor"
            port = 8001
            url = f"http://{hostname}:{port}/healthcheck"
            print(f"Testing HTTP connection to {url}")
            response = requests.get(url, timeout=2)
            result["http_test"] = {
                "url": url,
                "status_code": response.status_code,
                "content": response.text[:100] if response.text else None
            }
        except Exception as e:
            result["http_test"] = {
                "error": str(e)
            }
            
    except Exception as e:
        result["error"] = str(e)
    
    return result

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
    try:
        # This endpoint can still be implemented with the docker client as before
        client = get_docker_client()
        if client:
            container = client.containers.get("kafka-producer")
            logs = container.logs(tail=1000).decode("utf-8")
            return {"logs": logs}
        else:
            return {"error": "Docker client initialization failed"}
    except Exception as e:
        print(f"Error fetching Kafka logs: {str(e)}")
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
@app.get("/api/charts")
async def get_charts():
    try:
        # Ensure directories exist
        output_dir = Path('city-api/generated-artifacts')
        csv_dir = output_dir / 'csvs'
        chart_dir = output_dir / 'charts'
        os.makedirs(chart_dir, exist_ok=True)
        os.makedirs(csv_dir, exist_ok=True)

        # Get cities from configuration
        config_path = Path('configuration.yml')
        if not config_path.exists():
            return JSONResponse(
                content={"error": "Configuration file not found"},
                status_code=500
            )

        with open(config_path) as f:
            config = yaml.safe_load(f)

        cities = config.get('debugApi', {}).get('citiesPool', [])
        if not cities:
            return JSONResponse(
                content={"error": "No cities configured"},
                status_code=500
            )

        # Process data and generate charts
        charts = []
        chart_files = chart_dir.glob('*.png')
        for chart_file in chart_files:
            charts.append(f"/api/chart-images/{chart_file.name}")

        return JSONResponse(content={"charts": charts})
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

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