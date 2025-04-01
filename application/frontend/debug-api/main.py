from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/flink/logs")
async def get_logs(type: str = "raw"):
    try:
        import docker
        client = docker.from_env()
        container = client.containers.get("flink-processor")
        logs = container.logs().decode("utf-8").split("\n")
        filtered_logs = [log for log in logs if (type == "raw" and "Raw data received" in log) or (type == "db" and "Inserting into DB" in log)]
        return filtered_logs[-100:] if filtered_logs else []
    except Exception as e:
        print(f"Error fetching logs: {str(e)}")
        return [] 