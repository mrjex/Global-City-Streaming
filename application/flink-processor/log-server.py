import datetime
import time
from flask import Flask, Response
from flask_cors import CORS
from threading import Thread

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Separate logs for raw data and DB operations
raw_logs = []
db_logs = []

def log_raw_data(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] Raw data received: {msg}"
    raw_logs.append(log_entry)
    if len(raw_logs) > 1000:  # Keep last 1000 logs
        raw_logs.pop(0)
    print(log_entry)

def log_db_operation(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] Inserting into DB: {msg}"
    db_logs.append(log_entry)
    if len(db_logs) > 1000:  # Keep last 1000 logs
        db_logs.pop(0)
    print(log_entry)

@app.route('/logs/raw')
def get_raw_logs():
    response = Response('\n'.join(raw_logs), mimetype='text/plain')
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/logs/db')
def get_db_logs():
    response = Response('\n'.join(db_logs), mimetype='text/plain')
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def start_flask():
    app.run(host='0.0.0.0', port=8001, debug=False)

if __name__ == "__main__":
    flask_thread = Thread(target=start_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Keep main thread alive
    while True:
        time.sleep(1) 