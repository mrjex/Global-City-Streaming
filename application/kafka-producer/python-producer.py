import datetime
import time
import schedule
import requests
import sys
import os
from pathlib import Path

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


if __name__ == "__main__":
  exportSettings()
  gen_data()
  schedule.every(intervalTime).seconds.do(gen_data)

  while True:
    schedule.run_pending()
    time.sleep(idleTime)