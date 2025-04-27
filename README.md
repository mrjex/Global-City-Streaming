# 🌎 Global City Streaming

> Real-time global temperature analysis through modern streaming architecture

![project-logo-3](docs/readme-pictures/global/global-feature-logo-3.png)

## 🎯 Overview
This is the main repository for the Global City Streaming project, a comprehensive system for real-time temperature analysis across global cities using modern streaming architecture.

## 🏗 Technology Stack

### Core Technologies
[![Kafka](https://img.shields.io/badge/Kafka-Streaming-red)](https://kafka.apache.org/)
[![Flink](https://img.shields.io/badge/Flink-Processing-blue)](https://flink.apache.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-lightblue)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.8+-green)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-Framework-000000)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Language-3178C6)](https://www.typescriptlang.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D)](https://redis.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-412991)](https://openai.com/)
[![Terraform](https://img.shields.io/badge/Terraform-Infrastructure-7B42BC)](https://www.terraform.io/)
[![DigitalOcean](https://img.shields.io/badge/DigitalOcean-Cloud-0080FF)](https://www.digitalocean.com/)

### Infrastructure
- Confluent Inc
- Bitnami
- Docker Compose
- Microservices Architecture

## 📦 Project Components
This project is composed of several microservices, each maintained in its own repository:

### Frontend & API
- [Frontend Service](https://github.com/mrjex/Frontend-Global-City-Streaming) - React/Next.js frontend application
- [City API Service](https://github.com/mrjex/City-API-Global-City-Streaming) - FastAPI service for city data

### Data Processing
- [Kafka Producer](https://github.com/mrjex/Kafka-Producer-Global-City-Streaming) - Real-time data producer
- [Flink Processor](https://github.com/mrjex/Flink-Processor-Global-City-Streaming) - Stream processing service

### Data Storage
- [Redis Service](https://github.com/mrjex/Redis-Global-City-Streaming) - Caching layer
- [Database Manager](https://github.com/mrjex/Database-Manager-Global-City-Streaming) - Database management service
- [PostgreSQL Service](https://github.com/mrjex/Postgres-Global-City-Streaming) - Primary data storage

## 📚 Documentation
- [Architecture Documentation](./docs/README-ARCHITECTURE.md) - System architecture and components
- [Development Process](./docs/README-DEVELOPMENT-PROCESS.md) - Development journey and decisions
- [Charts & Visualization](./docs/README-CHARTS.md) - Data visualization details
- [Equator Analysis](./docs/README-EQUATOR-ANALYSIS.md) - Temperature-equator correlation study
- [API Documentation](./docs/README-API.md) - API endpoints and usage
- [Setup Guide](./docs/README-SETUP.md) - Installation and configuration
- [Testing Guide](./docs/README-TESTING.md) - Testing procedures

## 🚀 Quick Start
```bash
# Clone the repository with submodules
git clone --recursive https://github.com/mrjex/Global-City-Streaming.git

# Start the application
./start.sh

# Stop the application
./stop.sh
```

For detailed setup instructions, see the [Setup Guide](./docs/README-SETUP.md).

## 📊 Features
- Real-time temperature monitoring across global cities
- Advanced data visualization with multiple chart types
- Equator distance temperature analysis
- Scalable microservices architecture
- Automated deployment and testing
- Persistent data storage with Docker volumes


---

*Developed by Joel Mattsson*