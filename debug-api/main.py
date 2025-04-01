from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
# from flink_logs import get_flink_logs  # No longer needed
import os
import json
import requests
import docker
from fastapi.responses import PlainTextResponse, JSONResponse

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/flink/logs")
# async def flink_logs(type: str = Query('raw', enum=['raw', 'db'])):
#     print(f"GET /flink/logs called with type={type}")
#     logs = get_flink_logs(type)
#     print(f"get_flink_logs returned {len(logs)} logs")
#     return logs

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
        client = docker.from_env()
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
    except Exception as e:
        result["docker_client_error"] = str(e)
    
    # Since we now use Docker client directly, we don't need HTTP tests anymore
    # Let's just check if we can get logs directly
    try:
        client = docker.from_env()
        container = client.containers.get("flink-processor")
        logs = container.logs(tail=10).decode("utf-8")
        
        result["logs_test"] = {
            "success": True,
            "log_preview": logs[:200] if logs else "No logs found",
            "log_length": len(logs)
        }
    except Exception as e:
        result["logs_test"] = {
            "success": False,
            "error": str(e)
        }
    
    return result

@app.get("/proxy/flink/logs/raw", response_class=PlainTextResponse)
async def proxy_flink_raw_logs():
    """
    Fetch raw logs directly from flink-processor container using Docker client.
    """
    print("GET /proxy/flink/logs/raw called")
    try:
        client = docker.from_env()
        container = client.containers.get("flink-processor")
        logs = container.logs(tail=2000).decode("utf-8")
        print(f"Retrieved {len(logs)} bytes of logs directly from container")
        
        # Filter logs - only include lines with "Raw data received"
        raw_logs = []
        for line in logs.split('\n'):
            if "Raw data received" in line:
                raw_logs.append(line)
        
        filtered_logs = '\n'.join(raw_logs)
        print(f"Filtered to {len(filtered_logs)} bytes of raw logs")
        return filtered_logs if filtered_logs else "No raw logs found"
    except Exception as e:
        error_msg = f"Error accessing flink processor container: {str(e)}"
        print(error_msg)
        return error_msg

@app.get("/proxy/flink/logs/db", response_class=PlainTextResponse)
async def proxy_flink_db_logs():
    """
    Fetch DB logs directly from flink-processor container using Docker client.
    """
    print("GET /proxy/flink/logs/db called")
    try:
        client = docker.from_env()
        container = client.containers.get("flink-processor")
        logs = container.logs(tail=2000).decode("utf-8")
        print(f"Retrieved {len(logs)} bytes of logs directly from container")
        
        # Filter logs - only include lines with "Inserting into DB"
        db_logs = []
        for line in logs.split('\n'):
            if "Inserting into DB" in line:
                db_logs.append(line)
        
        filtered_logs = '\n'.join(db_logs)
        print(f"Filtered to {len(filtered_logs)} bytes of DB logs")
        return filtered_logs if filtered_logs else "No DB logs found"
    except Exception as e:
        error_msg = f"Error accessing flink processor container: {str(e)}"
        print(error_msg)
        return error_msg

@app.get("/api/kafka-logs")
async def get_kafka_logs():
    try:
        # This endpoint can still be implemented with the docker client as before
        client = docker.from_env()
        container = client.containers.get("kafka-producer")
        logs = container.logs(tail=1000).decode("utf-8")
        return {"logs": logs}
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
    print("GET /api/flink-logs/raw called")
    # Just call the existing endpoint
    return await proxy_flink_raw_logs()

@app.get("/api/flink-logs/db", response_class=PlainTextResponse)
async def api_flink_db_logs():
    """
    Frontend-facing endpoint for Flink DB logs.
    Maps to /proxy/flink/logs/db for consistency.
    """
    print("GET /api/flink-logs/db called")
    # Just call the existing endpoint
    return await proxy_flink_db_logs()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"} 