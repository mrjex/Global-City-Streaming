# 📝 Development Process

## Project Timeline

The first version of the project was developed throughout June of 2024, and it was further developed and finalized in April 2025.

## Learning Objectives
- Data aggregation and processing
- Real-time data streaming
- Data visualization techniques
- Microservices architecture
- Docker containerization
- API integration

## Development Journey

### Initial Scope
- Started with 5 pre-defined cities in Europe
- Basic temperature monitoring
- Simple data visualization

### Scalability Evolution
- Expanded to global city coverage
- Implemented microservices architecture
- Added multiple visualization types
- Developed equator distance analysis

### Automation Development
The project emphasizes automation through shell scripting:

#### Container Debugging Examples
1. Kafka Producer Debugging:
![3. container-debuggin-kafka](../docs/readme-videos/3.%20container-debuggin-kafka-producer-desktop-shell-terminal.mp4)

2. Log Analysis:
![3. container-debugging-logs](../docs/readme-videos/3.%20container-debugging-logs.mp4)

3. PostgreSQL Debugging:
![3. container-debugging-postgres-sql](../docs/readme-videos/3.%20container-debugging-postgres-sql-commands-real-time.mp4)
![3. container-debugging-postgres-terminal](../docs/readme-videos/3.%20container-debugging-postgres-terminal-shell-queries.mp4)

4. Zookeeper and Flink:
![3. container-debugging-zookeper-flink](../docs/readme-videos/3.%20container-debugging-zookeeper-and-flink.mp4)

### Data Visualization Development
1. Bubble Chart Implementation:
![4. data-visualization-bubble-chart](../docs/readme-videos/4.%20data-visualization-bubble-chart.mp4)

2. Pie Chart Development:
![4. data-visualization-pie-chart](../docs/readme-videos/4.%20data-visualization-pie-chart.mp4)

3. UTC Visualization:
![4. data-visualization-utc+2](../docs/readme-videos/4.%20data-visualization-utc+2.mp4)

### Automation Features
The project includes several automation scripts:
- `combinatorial-automations.sh`
- `bubbleChart-combinations.sh`
- `pieChart-combinations.sh`
- `equator-combinations.sh`

#### Automation Examples
1. Curve Linear Analysis:
![5. combination-automation-similar-curve-linear](../docs/readme-videos/5.%20combination-automation-similar-curve-linear.mp4)

2. Equator Continents Analysis:
![5. combinations-equator-continents-with-without-logaritmic](../docs/readme-videos/5.%20combinations-equator-continents-with-without-logaritmic.mp4)

3. Pie Chart Combinations:
![5. combinations-piecharts](../docs/readme-videos/5.%20combinations-piecharts.mp4)

## Technical Evolution

### Visualization Technology
- Started with matplotlib
- Migrated to Plotly for enhanced features
- Implemented custom color themes
- Added interactive visualizations

### Database Evolution
- Implemented PostgreSQL for primary storage
- Added Redis for caching
- Developed JSON-based storage for specific features

### API Integration
- Weather API integration
- Geolocation API development
- Math Curve API implementation
- Color API integration

## Learning Outcomes

### Data Processing
- Learned data aggregation techniques
- Implemented data formatting and simplification
- Developed efficient processing pipelines

### Code Quality
- Implemented lambda functions for array operations
- Enhanced code readability
- Improved algorithm efficiency
- Applied software design patterns

For more detailed information about specific components, refer to:
- [Architecture Documentation](./README-ARCHITECTURE.md)
- [Charts Documentation](./README-CHARTS.md)
- [API Documentation](./README-API.md)