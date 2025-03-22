# SQL Debugging


This sub-direcotry is for the developers that desire to interact with the system and generate or analyize data. Moreover, as the folder's name implies ('sql-debugging'), the functionality offered in this directory is only concerned with the SQL aspect of the project. As mentioned in the main README file, only the BubbleChart and PieChart are generated from the SQL database, whereas the EquatorChart is derived the JSON files in "/apis/database/*". With that said, you'll find this directory useful if you are faced with one of the following tasks:

    - A

    - B

    - Explore the relations between the database instances




- SQL Debugging in real-time
- Watch the data from kafka to flink in real-time


## Contained Files


Each file in this subdirectory has its purpose in facilitating the job for the developer to access the data:


- debug-queries.sql   -->   Executable SQL commands to filter database instance. Note that you can perform queries on the database at the same time as the          application is running from docker-compose and see the instances get inserted in real-time.


- query-shell.sh   -->   Enter the shell of the 'postgres' docker container and perform the SQL commands. The only dependency to successfully do this is to run the corresponding container concurrently.


- generateCityCsvs.py   -->   Filters the SQL instances by their city names and generates their respective data in separate CSV files. The output directory is "/generated-artifacts/csvs/*"





## TODO

Brief description about this subdirectory + at least 2 draw.io pictures showing the shell scripts' relations and entrypoints to the system