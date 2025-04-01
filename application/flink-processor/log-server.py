import datetime
import time
import re
import glob
import os
from flask import Flask, Response
from flask_cors import CORS
from threading import Thread
import subprocess

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Separate logs for raw data and DB operations
raw_logs = []
db_logs = []

def find_log_file():
    """Find the most recent Flink log file."""
    possible_paths = [
        '/opt/flink/log/flink-*-taskexecutor-*.out',
        '/opt/flink/log/flink-*.out',
        '/opt/flink/log/*.out',
        '/opt/flink/log/*'
    ]
    
    for pattern in possible_paths:
        files = glob.glob(pattern)
        if files:
            # Sort by modification time, newest first
            return max(files, key=os.path.getmtime)
    
    return None

def parse_and_store_log(log_line):
    if not log_line:
        return
        
    try:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Check if the log line already has a timestamp
        if '[' in log_line and ']' in log_line:
            # Extract existing timestamp if present
            timestamp = log_line[log_line.find('[')+1:log_line.find(']')]
            log_line = log_line[log_line.find(']')+1:].strip()
        
        print(f"Processing log line: {log_line}")  # Debug print
        
        if "Raw data received:" in log_line:
            log_entry = f"[{timestamp}] {log_line}"
            raw_logs.append(log_entry)
            print(f"Added raw log: {log_entry}")  # Debug print
            if len(raw_logs) > 1000:
                raw_logs.pop(0)
        elif "Inserting into DB:" in log_line:
            log_entry = f"[{timestamp}] {log_line}"
            db_logs.append(log_entry)
            print(f"Added DB log: {log_entry}")  # Debug print
            if len(db_logs) > 1000:
                db_logs.pop(0)
    except Exception as e:
        print(f"Error parsing log line: {e}")

@app.route('/logs/raw')
def get_raw_logs():
    print(f"Serving {len(raw_logs)} raw logs")  # Debug print
    response = Response('\n'.join(raw_logs), mimetype='text/plain')
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/logs/db')
def get_db_logs():
    print(f"Serving {len(db_logs)} DB logs")  # Debug print
    response = Response('\n'.join(db_logs), mimetype='text/plain')
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def start_flask():
    app.run(host='0.0.0.0', port=8001, debug=False)

def monitor_flink_logs():
    while True:
        try:
            # Find the log file
            log_file = find_log_file()
            if not log_file:
                print("No log file found, waiting...")
                time.sleep(5)
                continue
                
            print(f"Monitoring log file: {log_file}")
            
            # Try different methods to read the logs
            try:
                # First try: tail command
                process = subprocess.Popen(
                    ['tail', '-F', log_file],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True
                )
                
                while True:
                    line = process.stdout.readline()
                    if line:
                        parse_and_store_log(line.strip())
                    
            except Exception as e:
                print(f"Tail command failed: {e}")
                
                # Second try: direct file reading
                with open(log_file, 'r') as f:
                    # Seek to end of file
                    f.seek(0, 2)
                    while True:
                        line = f.readline()
                        if line:
                            parse_and_store_log(line.strip())
                        else:
                            time.sleep(0.1)
                            
        except Exception as e:
            print(f"Error in monitor_flink_logs: {e}")
            time.sleep(5)  # Wait before retrying

def monitor_stdout():
    """Directly monitor stdout for Flink logs."""
    while True:
        try:
            process = subprocess.Popen(
                ['docker', 'logs', '-f', 'flink-processor'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
            while True:
                line = process.stdout.readline()
                if line:
                    parse_and_store_log(line.strip())
                    
        except Exception as e:
            print(f"Error monitoring stdout: {e}")
            time.sleep(5)

if __name__ == "__main__":
    print("Starting log server...")
    
    # Start Flask server in a separate thread
    flask_thread = Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()
    print("Flask server started")
    
    # Start log monitoring in separate threads
    log_monitor_thread = Thread(target=monitor_flink_logs)
    log_monitor_thread.daemon = True
    log_monitor_thread.start()
    print("Log file monitoring started")
    
    stdout_monitor_thread = Thread(target=monitor_stdout)
    stdout_monitor_thread.daemon = True
    stdout_monitor_thread.start()
    print("Stdout monitoring started")
    
    # Keep main thread alive
    while True:
        time.sleep(1) 