# 🏗️ Architecture Documentation V2

As mentioned in [Development Process](README-DEVELOPMENT-PROCESS.md), I developed this system throughout two intensive phases. The first one being in June 2024, and the second one in April 2025. This file describes the system's state as of April 2025, after my second development phase. If you wish to view the previous architectural state, navigate to [Architecture V1](README-ARCHITECTURE-V1.md)


## System Overview
The Global City Streaming project is a distributed system that processes and visualizes real-time weather data from cities worldwide. The system is built using a microservices architecture with the following key components:

## Microservices Architecture

### 1. City API Service
- **Repository**: [city-api](https://github.com/joel0/city-api)
- **Purpose**: Manages city data and weather information
- **Technologies**: Spring Boot, Java
- **Key Features**:
  - Weather data fetching
  - City information management
  - RESTful API endpoints

### 2. Frontend Service
- **Repository**: [frontend](https://github.com/joel0/frontend)
- **Purpose**: User interface for data visualization
- **Technologies**: React, TypeScript
- **Features**:
  - Interactive maps
  - Real-time data display
  - Responsive design

### 3. Kafka Producer
- **Purpose**: Event streaming and data ingestion
- **Technologies**: Apache Kafka
- **Responsibilities**:
  - Weather data collection
  - Event publishing
  - Data transformation

### 4. Flink Processor
- **Purpose**: Stream processing and analytics
- **Technologies**: Apache Flink
- **Features**:
  - Real-time data processing
  - Complex event processing
  - Analytics computation

### 5. Database Manager
- **Repository**: [db-manager](https://github.com/joel0/db-manager)
- **Purpose**: Database operations and management
- **Technologies**: PostgreSQL, Redis
- **Features**:
  - Data persistence
  - Cache management
  - Query optimization


## Component Interactions

### Data Collection Flow
1. City API fetches weather data
2. Kafka Producer ingests and publishes events
3. Flink processes streaming data
4. Database Manager stores processed results

### Data Retrieval Flow
1. Frontend requests data
2. Redis cache check
3. PostgreSQL fallback if cache miss


For more information about:
- [API Documentation](./README-API.md)
- [Development Process](./README-DEVELOPMENT-PROCESS.md)
- [Charts Documentation](./README-CHARTS.md)