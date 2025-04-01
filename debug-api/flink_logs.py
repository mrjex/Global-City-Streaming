import docker
from typing import List
import json

def get_flink_logs(log_type: str = 'raw') -> List[str]:
    client = docker.from_env()
    try:
        container = client.containers.get('global-city-streaming-flink-processor-1')
        logs = container.logs(tail=50, timestamps=True).decode('utf-8')
        
        # Filter logs based on type
        filter_text = 'Raw data received:' if log_type == 'raw' else 'Inserting into DB:'
        filtered_logs = [
            line for line in logs.split('\n')
            if filter_text in line and line.strip()
        ]
        
        return filtered_logs[-50:] if filtered_logs else []
        
    except Exception as e:
        print(f"Error fetching Flink logs: {str(e)}")
        return []

if __name__ == "__main__":
    # Test the function
    raw_logs = get_flink_logs('raw')
    db_logs = get_flink_logs('db')
    print("Raw logs:", json.dumps(raw_logs, indent=2))
    print("DB logs:", json.dumps(db_logs, indent=2)) 