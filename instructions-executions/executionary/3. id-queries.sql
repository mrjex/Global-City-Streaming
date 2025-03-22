-- Select all instances
SELECT * FROM weather;



-- Select all instances whose ids are divisible by 2
SELECT * FROM weather
WHERE mod(id, 2) = 0;


-- Select the instance with the highest id (the most recently inserted db-instance)
SELECT * FROM weather
WHERE id = (
    SELECT MAX(id) FROM weather
);



-- Select all the db-instances where one of the identifiers is 3
SELECT * FROM weather
WHERE city = (
    SELECT city FROM weather WHERE id = 3
);