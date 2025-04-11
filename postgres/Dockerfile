# Pull postgres 16 image for compatibility
FROM postgres:16

# Create custom postgresql.conf
RUN echo "\
shared_buffers = ${POSTGRES_SHARED_BUFFERS:-1GB}\n\
work_mem = ${POSTGRES_WORK_MEM:-16MB}\n\
maintenance_work_mem = ${POSTGRES_MAINTENANCE_WORK_MEM:-256MB}\n\
effective_cache_size = ${POSTGRES_EFFECTIVE_CACHE_SIZE:-3GB}\n\
random_page_cost = 1.1\n\
effective_io_concurrency = 200\n\
checkpoint_completion_target = 0.9\n\
wal_buffers = 16MB\n\
default_statistics_target = 100\n\
" > /etc/postgresql.conf

# Put the .sql file in the execution-directory of the container
COPY create_table.sql /docker-entrypoint-initdb.d/

# Use custom config
CMD ["postgres", "-c", "config_file=/etc/postgresql.conf"]