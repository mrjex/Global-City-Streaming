import requests
import sys

def get_country_code(country_name):
    res = requests.get(f"https://restcountries.com/v3.1/name/{country_name}")
    data = res.json()
    return data[0]["cca2"]

if __name__ == "__main__":
    if len(sys.argv) > 1:
        country_name = sys.argv[1]
        try:
            code = get_country_code(country_name)
            print(f"Country Code (alpha-2):{code}")
        except Exception as e:
            print(f"Error: {e}")
