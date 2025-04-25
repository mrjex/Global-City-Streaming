#!/usr/bin/env python3
import yaml
import subprocess
import json
import os
import sys

def main():
    # Define paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dev_endpoints_dir = os.path.dirname(current_dir)
    project_root = os.path.dirname(dev_endpoints_dir)
    
    config_file = os.path.join(project_root, 'configuration.yml')
    script_path = os.path.join(project_root, 'shared', 'weather', 'city_coordinates.py')
    output_json = os.path.join(current_dir, 'static-cities.json')
    
    print(f"Config file path: {config_file}")
    print(f"Script path: {script_path}")
    print(f"Output JSON path: {output_json}")
    
    # Read city list from configuration.yml
    try:
        with open(config_file, 'r') as file:
            config = yaml.safe_load(file)
            if 'cities' in config and isinstance(config['cities'], list):
                cities = config['cities']
                print(f"Found {len(cities)} cities in configuration")
            else:
                print("Error: No cities found in configuration or invalid format")
                sys.exit(1)
    except Exception as e:
        print(f"Error reading configuration file: {e}")
        sys.exit(1)
    
    # Call city_coordinates.py with the list of cities
    try:
        cmd = [sys.executable, script_path] + cities
        print(f"Executing: {' '.join(cmd[:2])} [list of {len(cities)} cities]")
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Error running city_coordinates.py: {result.stderr}")
            sys.exit(1)
        
        # Parse the JSON output
        try:
            city_data = json.loads(result.stdout)
            print(f"Successfully retrieved coordinates for {len(city_data)} cities")
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON output: {e}")
            print(f"Raw output: {result.stdout}")
            sys.exit(1)
    except Exception as e:
        print(f"Error executing city_coordinates.py: {e}")
        sys.exit(1)
    
    # Save the data to a JSON file
    try:
        with open(output_json, 'w') as file:
            json.dump(city_data, file, indent=2)
        print(f"Successfully saved coordinates to {output_json}")
    except Exception as e:
        print(f"Error saving JSON file: {e}")
        sys.exit(1)
    
    print("Process completed successfully!")

if __name__ == "__main__":
    main()
