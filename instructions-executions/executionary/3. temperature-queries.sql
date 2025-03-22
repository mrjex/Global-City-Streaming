-- Select every city where the temperature is greater than 90
SELECT *
FROM weather
WHERE average_temperature > 40;



-- Select every city with temperature greater than 25 in ascending order
SELECT *
FROM weather
WHERE average_temperature > 25
ORDER BY average_temperature ASC;



-- Select every city with temperature greater than 35 in descending order
SELECT *
FROM weather
WHERE average_temperature > 35
ORDER BY average_temperature DESC;



-- Select the instance with the highest temperature
SELECT * FROM weather
WHERE average_temperature = (
    SELECT MAX(average_temperature) FROM weather
);



-- Select the instance with the lowest temperature
SELECT * FROM weather
WHERE average_temperature = (
    SELECT MIN(average_temperature) FROM weather
);