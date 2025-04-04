# This script is used to get the cities of a specific country

# Innput: The name of the country, e.g "Sweden"

# Output: A list of cities in the country


# curl "https://countriesnow.space/api/v0.1/countries/cities/q?country=sweden"


# curl -s "https://countriesnow.space/api/v0.1/countries/cities/q?country=sweden" | jq '.data[] | select(test("göteborg"; "i"))'






# curl "https://countriesnow.space/api/v0.1/countries/flag/images/q?iso2=SE"