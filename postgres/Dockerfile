# Pull postgres 16 image for compatibility
FROM postgres:16

# Put the .sql file in the execution-directory of the container
COPY create_table.sql /docker-entrypoint-initdb.d/