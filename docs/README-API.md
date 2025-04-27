# 🔌 API Documentation

## Overview
The system integrates multiple APIs for different functionalities:
1. Weather API
2. Geolocation API
3. Math Curve API
4. Color API
5. Database APIs

## Weather API
- **Provider**: [WeatherAPI.com](https://www.weatherapi.com/login.aspx)
- **Purpose**: Fetches real-time weather data for geographical locations
- **Integration**: Core data source for temperature analysis

## Geolocation API
A composition of two sub-APIs for enhanced location data:

### 1. Continent API
- **Provider**: [TimeAPI](https://timeapi.io/swagger/index.html)
- **Purpose**: Determines continent information

### 2. TimeZone API
- **Provider**: [GeoTimeZone](https://www.geotimezone.com/)
- **Purpose**: Provides timezone data

### Combined Response Example
```json
{
    "timeZoneNotation": "Europe/Stockholm",
    "timeZoneOffset": "UTC+1"
}
```

## Math Curve API
- **Purpose**: Implements mathematical formula with logarithmic trend
- **Implementation**: Custom API for equator analysis
- **Response**: Returns two 90-element arrays representing:
  - Distance from equator (0-90 latitudes)
  - Calculated temperature values

## Color API
- **Provider**: [CSS Colors API](https://www.csscolorsapi.com/)
- **Purpose**: Generates color variations for visualizations
- **Constraints**: Limited to 18 color nuances
- **Implementation**: Uses modulo operator for exceeding values

### Color Distribution Solution
Current implementation:
```
i:th city color = (i * 18x)th city color
```

Future potential enhancement:
- Sophisticated RGB range distribution
- Alpha-channel integration
- Previous combination tracking

## Database APIs

### PostgreSQL API
- **Purpose**: Primary database operations
- **Output**: CSV and PNG files
- **Location**: `/debug-api/generates-artifacts/*`

### JSON Database API
- **Purpose**: Equator chart data storage
- **Operations**: JSON-based storage and queries

## API Testing

### Weather API Tests
![api-weather-tests](../docs/readme-videos/api-tests-weather.mp4)

### Geolocation API Tests
![api-geolocation-tests](../docs/readme-videos/api-tests-geolocation.mp4)

### Color API Tests
![api-color-tests](../docs/readme-videos/api-tests-color-theme.mp4)

## Configuration
API settings are managed through `configuration.yml`. Example structure:

```yaml
debugApi:
  citiesPool:
  - {CITY_NAME_1}
  - {CITY_NAME_N}
  queryConfig:
    queryAttribute: {QUERY_ATTRIBUTE}
    queryRequirement: {QUERY_REQUIREMENT}
  charts:
    bubbleChart:
      separateGraphDisplay: {BOOLEAN}
      colorTheme: {COLOR_THEME}
      pngOutput: {BOOLEAN}
```

For more information about:
- [Architecture Documentation](./README-ARCHITECTURE-V2.md)
- [Development Process](./README-DEVELOPMENT-PROCESS.md)
- [Charts Documentation](./README-CHARTS.md) 