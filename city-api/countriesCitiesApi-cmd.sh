


# Command 1: Get the cities of a specific country
curl "https://countriesnow.space/api/v0.1/countries/cities/q?country=sweden"


# Command 1.1: Filter cities of a specific country
curl -s "https://countriesnow.space/api/v0.1/countries/cities/q?country=sweden" | jq '.data[] | select(test("göteborg"; "i"))'



# Command 2: Get the flag of a specific country
curl "https://countriesnow.space/api/v0.1/countries/flag/images/q?iso2=SE"






##  FINAL  ##

curl -X GET "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=SE&limit=3&sort=-population&types=CITY" \
  -H "X-RapidAPI-Host: wft-geo-db.p.rapidapi.com" \
  -H "X-RapidAPI-Key: $GEODB_CITIES_API_KEY"