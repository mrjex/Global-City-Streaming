# Initialize utils package
import yaml
import os

def parseYmlFile(file_path, dot_path):
    """
    Parse a YAML file and extract a value using dot notation path.
    
    Args:
        file_path (str): The path to the YAML file.
        dot_path (str): Dot notation path to the value (e.g., "section.subsection.value").
        
    Returns:
        The value at the specified path or None if not found.
    """
    try:
        if not os.path.exists(file_path):
            print(f"Warning: YAML file not found at: {file_path}")
            return None
            
        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)
        
        # Split the path and traverse the nested dictionaries
        path_parts = dot_path.split('.')
        current = data
        
        for part in path_parts:
            if not isinstance(current, dict) or part not in current:
                # Handle path parts that don't exist
                print(f"Warning: Path '{dot_path}' not found in YAML file. Failed at '{part}'")
                return None
            current = current[part]
        
        return current
    except Exception as e:
        print(f"Error parsing YAML file {file_path} with path {dot_path}: {str(e)}")
        return None