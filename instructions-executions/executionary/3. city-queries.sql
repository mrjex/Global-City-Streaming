-- Select all instances where the city is Stockholm
SELECT * FROM weather WHERE city LIKE 'Stockholm';



-- Select only the temperature column from all instances that are tied to Rome
SELECT average_temperature FROM weather Where city LIKE 'Rome'
ORDER BY id ASC;



-- Get the number of (rows or db-instances) in this case I selected the column 'city'
SELECT COUNT(city)
FROM weather;



-- Select a city based on its identifier
SELECT city FROM weather
WHERE id = 10;