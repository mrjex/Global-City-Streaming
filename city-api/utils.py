import yaml
import os

def parseYmlFile(pathToConfigFile, pathToValue):
    """
    Parse a YAML file and return the value at the specified path.
    
    Args:
        pathToConfigFile (str): Path to the YAML file
        pathToValue (str): Dot-separated path to the value (e.g., "realTimeProduction.cities")
    
    Returns:
        The value at the specified path in the YAML file
    """
    try:
        with open(pathToConfigFile, 'r') as f:
            config = yaml.safe_load(f)
            
        # Split the path into parts
        path_parts = pathToValue.split('.')
        
        # Navigate through the nested structure
        current = config
        for part in path_parts:
            current = current[part]
            
        return current
    except Exception as e:
        print(f"Error parsing YAML file: {e}")
        return [] 