from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from flink_logs import get_flink_logs
import os
import json
import requests
import docker

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/flink/logs")
async def flink_logs(type: str = Query('raw', enum=['raw', 'db'])):
    logs = get_flink_logs(type)
    return logs

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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"} 