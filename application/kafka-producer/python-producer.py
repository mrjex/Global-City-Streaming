import datetime
import time
import schedule
import requests
import sys
import os
from pathlib import Path
import json
import random
from flask import Flask, Response
from flask_cors import CORS

# Add project root to Python path
project_root = str(Path(__file__).resolve().parents[2])
sys.path.append(project_root)

from json import dumps

from kafka import KafkaProducer
import glob
import utils
from dotenv import load_dotenv


##  External pipeline configurations  ##
kafka_nodes = "kafka:9092"
myTopic = "weather"


## Weather API configurations  ##
load_dotenv()  # Load environment variables from .env file
apiKey = os.getenv('WEATHER_API_KEY')
apiUrl = "https://api.weatherapi.com/v1/current.json"
idleTime = 0.5 # Default: 0.5
intervalTime = 3 # Default: 3


# Cities to analyize and take real-time samples of in the kafka-to-flink pipeline.
# Note that this array of cities must be identical to the local city array declared
# in "/debug-api/charts/real-time-multi-samples" in 'bubble-chart.py' and
# 'pie-chart.py'
cities = utils.parseYmlFile(os.path.join(project_root, "configuration.yml"), "realTimeProduction.cities")


def exportSettings():
  # print(glob.glob("*")) # For debugging purposes. Prints the files in the current directory in the docker container

  # Create directory if it doesn't exist
  os.makedirs("./mnt", exist_ok=True)
  
  file1 = open("./mnt/exec-settings.txt", "w")

  apiRequestInterval = idleTime + intervalTime

  output = [f"API Request Intervals (seconds) = {apiRequestInterval}\n"]
 
  # \n is placed to indicate EOL (End of Line)
  file1.write("-- -- - EXECUTION SETTINGS - -- -- \n\n")
  file1.writelines(output)
  file1.close()  # to change file access modes


def fetch_api_data(city):
  query = {'key': apiKey, 'q': city, 'aqi':'yes'}
  response = requests.get(apiUrl, params=query)
  body_dict = response.json()
  temperature = body_dict['current']['temp_c']  # Access temperature from the 'current' object
  return temperature


def gen_data():

  for city in cities:
    prod = KafkaProducer(bootstrap_servers=kafka_nodes, value_serializer=lambda x:dumps(x).encode('utf-8'))

    currentCelsiusTemperature = fetch_api_data(city)
    my_data = {'city': city, 'temperature': float(currentCelsiusTemperature)}

    print(my_data)
    prod.send(topic=myTopic, value=my_data)

    prod.flush()


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
logs = []  # Store logs in memory

def log_message(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    logs.append(log_entry)
    if len(logs) > 1000:  # Keep last 1000 logs
        logs.pop(0)
    print(log_entry)  # Also print to container logs

@app.route('/logs')
def get_logs():
    print(f"Logs endpoint called, returning {len(logs)} logs")  # Debug print
    response = Response('\n'.join(logs), mimetype='text/plain')
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def main():
    log_message("Starting Kafka producer...")
    log_message("Connected to Kafka broker")

    while True:
        try:
            for city in cities:
                temperature = round(random.uniform(-10, 40), 2)
                data = {
                    "city": city,
                    "temperature": str(temperature)
                }
                
                prod = KafkaProducer(bootstrap_servers=kafka_nodes, value_serializer=lambda x: json.dumps(x).encode('utf-8'))
                prod.send(topic=myTopic, value=data)
                log_message(f"Sent data: {json.dumps(data)}")
                prod.close()
            
            time.sleep(1)
        except Exception as e:
            log_message(f"Error in main loop: {str(e)}")
            time.sleep(1)

if __name__ == "__main__":
    # Start Flask in a separate thread
    from threading import Thread
    flask_thread = Thread(target=lambda: app.run(host='0.0.0.0', port=8000, debug=False))
    flask_thread.daemon = True
    flask_thread.start()
    
    # Run the main Kafka producer
    main()