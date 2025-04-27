# 🏗️ Architecture Documentation V1

As mentioned in [Development Process](README-DEVELOPMENT-PROCESS.md), I developed this system throughout two intensive phases. The first one being in June 2024, and the second one in April 2025. This file describes the system's state as of June 2024, after my first development phase. If you wish to view the current architectural state, navigate to [Architecture V2](README-ARCHITECTURE-V2.md)




## Architecture


![architecture-all](readme-pictures/architecture/entire-architecture-1.PNG)



### Developer Endpoints

![architecture-2](readme-pictures/architecture/entire-architecture-2.PNG)


### Data Production

![architecture-3](readme-pictures/architecture/entire-architecture-3.PNG)


### Debug API

![architecture-4](readme-pictures/architecture/entire-architecture-4.PNG)



## Data Flow


### Shell Scripts

![4-shell-script-flow](readme-pictures/architecture/4-shell-script-flow.PNG)



![5-shell-script-flow](readme-pictures/architecture/5-shell-script-flow.PNG)



### Equator Chart Queries


#### Continent Query

![equator-chart-continent-query-flow](readme-pictures/architecture/json-db-equatorChart-flow-continent.PNG)


#### Timezone Query

![equator-chart-timezone-query](readme-pictures/architecture/json-db-equatorChart-flow-timeZoneOffset.PNG)



## Docker Volume

![docker-volume](readme-pictures/architecture/docker-volumes-project-architecture.PNG)