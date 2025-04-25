# City-Api Redis Manager Cahcing and Redis container


Redis Data Structure
The application uses both a legacy and a new structure for data storage:
New Structure
Static Cities:
static:cities:all: A Redis Set containing all static city names
static:city:<cityname>: A Redis Hash with all city details including coordinates, temperature, country, continent
static:country_codes: A Redis Hash mapping countries to their country codes
Dynamic Cities:
dynamic:countries:all: A Redis Set containing all countries with dynamic city data
dynamic:country_codes: A Redis Hash mapping countries to their country codes
dynamic:country:<country>: A Redis Hash containing country data including country code and a JSON list of city names
dynamic:city:<country>:<cityname>: A Redis Hash containing city details including coordinates, descriptions, videos