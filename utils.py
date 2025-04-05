#####     UTILS     #####

import yaml

# Function:
#   - This function parses a key-value structured file, by traversing the nested
#     structure separated by dots. With that said, it allows you to access values
#     of the desired attributes
#
# Parameters:
#   - pathToConfigFile: The local path to 'configuration.yml' from the python file
#                       in which the function was invoked from
#
#   - commands: A string seperated by '.' such that each substring is a new nested
#               branch in the .yml file. Note that if the provided string is incomplete
#               i.e it doesn't end in the deepest key-value pair, then a nested
#               key-value structure is returned. A few appropriate values for this
#               parameter, with respect to the already existing 'configuration.yml'
#               file, are:
#                   - "debugApi.queryConfig.queryAttribute"
#                   - "debugApi.queryConfig.queryRequirement"
#                   - "debugApi.charts.bubbleChart.bubbleColorTheme"
#                   - "debugApi.charts.equatorChart.displayLogarithmicTrend"
#
def parseYmlFile(pathToConfigFile, commands):
    try:
        with open(pathToConfigFile, 'r') as f:
            config = yaml.safe_load(f)
            
        # Split the path into parts
        path_parts = commands.split('.')
        
        # Navigate through the nested structure
        current = config
        for part in path_parts:
            current = current[part]
            
        return current
    except Exception as e:
        print(f"Error parsing YAML file: {e}")
        return []