# Shared Utilities Directory

This directory contains shared utilities and common functionality used across multiple system components in the Global City Streaming project. The purpose of this directory is to:

1. **Reusability**: Common utilities and functions are centralized here to avoid code duplication across different containers and services.

2. **Consistency**: By sharing common code, we maintain consistent behavior and patterns across the system.

3. **Maintenance**: Updates to shared functionality only need to be made in one place, making maintenance easier and reducing the risk of inconsistencies.

## Directory Structure

- `monitoring/`: Contains shared monitoring utilities and metrics collection code used by various system components
- `weather/`: Contains shared weather-related utilities and data processing functions used across the system

## Usage

Components that need to use these shared utilities should:

1. Mount this directory as a volume in their container configuration
2. Import the required utilities from the appropriate subdirectory
3. Follow the established patterns and interfaces defined in the shared code
