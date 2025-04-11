import psycopg2
import time
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('db-cleaner')

# Get environment variables with defaults
DB_HOST = os.environ.get('POSTGRES_HOST', 'postgres')
DB_PORT = os.environ.get('POSTGRES_PORT', '5432')
DB_NAME = os.environ.get('POSTGRES_DB', 'postgres')
DB_USER = os.environ.get('POSTGRES_USER', 'postgres')
DB_PASS = os.environ.get('POSTGRES_PASSWORD', 'postgres')

# Configuration for cleanup
MAX_RECORDS = int(os.environ.get('MAX_RECORDS', 5000))  # Maximum number of records to keep
CHECK_INTERVAL = int(os.environ.get('CHECK_INTERVAL', 60))  # Seconds between checks
BATCH_DELETE_SIZE = int(os.environ.get('BATCH_DELETE_SIZE', 1000))  # Number of records to delete at once


def connect_to_db():
    """Establish a connection to the Postgres database"""
    try:
        connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        logger.info("Successfully connected to the database")
        return connection
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        return None


def get_record_count(connection):
    """Get the current number of records in the weather table"""
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM weather")
        count = cursor.fetchone()[0]
        cursor.close()
        return count
    except Exception as e:
        logger.error(f"Error getting record count: {e}")
        return 0


def delete_oldest_records(connection, records_to_delete):
    """Delete the oldest records from the weather table"""
    try:
        cursor = connection.cursor()
        
        # Delete in batches to avoid locking the table for too long
        batches = (records_to_delete + BATCH_DELETE_SIZE - 1) // BATCH_DELETE_SIZE
        total_deleted = 0
        
        for _ in range(batches):
            batch_size = min(BATCH_DELETE_SIZE, records_to_delete - total_deleted)
            if batch_size <= 0:
                break
                
            cursor.execute("""
                DELETE FROM weather
                WHERE id IN (
                    SELECT id FROM weather
                    ORDER BY id ASC
                    LIMIT %s
                )
            """, (batch_size,))
            
            deleted = cursor.rowcount
            total_deleted += deleted
            connection.commit()
            
            logger.info(f"Deleted {deleted} records (batch)")
            
            # Short pause between batches to reduce load
            if total_deleted < records_to_delete:
                time.sleep(1)
        
        cursor.close()
        logger.info(f"Total records deleted: {total_deleted}")
        return total_deleted
    except Exception as e:
        logger.error(f"Error deleting records: {e}")
        connection.rollback()
        return 0


def main():
    """Main function to periodically check and clean up the database"""
    logger.info(f"Starting DB Cleaner with MAX_RECORDS={MAX_RECORDS}, CHECK_INTERVAL={CHECK_INTERVAL}s")
    
    # Wait for database to be ready
    time.sleep(10)
    
    while True:
        connection = None
        try:
            connection = connect_to_db()
            if connection:
                # Check record count
                record_count = get_record_count(connection)
                logger.info(f"Current record count: {record_count}")
                
                # Delete oldest records if above threshold
                if record_count > MAX_RECORDS:
                    records_to_delete = record_count - MAX_RECORDS
                    logger.info(f"Record count exceeds maximum ({MAX_RECORDS}). Will delete {records_to_delete} records.")
                    delete_oldest_records(connection, records_to_delete)
                else:
                    logger.info(f"Record count is below maximum threshold. No cleanup needed.")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            if connection:
                connection.close()
        
        # Wait before next check
        logger.info(f"Sleeping for {CHECK_INTERVAL} seconds before next check")
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main() 