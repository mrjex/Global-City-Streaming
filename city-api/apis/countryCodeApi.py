import sys

# ISO 3166-1 alpha-2 country codes for commonly used countries
COUNTRY_CODES = {
    "afghanistan": "AF", "albania": "AL", "algeria": "DZ", "andorra": "AD", "angola": "AO",
    "argentina": "AR", "armenia": "AM", "australia": "AU", "austria": "AT", "azerbaijan": "AZ",
    "bahrain": "BH", "bangladesh": "BD", "belarus": "BY", "belgium": "BE", "bhutan": "BT",
    "bolivia": "BO", "bosnia and herzegovina": "BA", "brazil": "BR", "bulgaria": "BG",
    "cambodia": "KH", "cameroon": "CM", "canada": "CA", "chile": "CL", "china": "CN",
    "colombia": "CO", "croatia": "HR", "cuba": "CU", "cyprus": "CY", "czech republic": "CZ",
    "denmark": "DK", "ecuador": "EC", "egypt": "EG", "estonia": "EE", "ethiopia": "ET",
    "finland": "FI", "france": "FR", "georgia": "GE", "germany": "DE", "greece": "GR",
    "hungary": "HU", "iceland": "IS", "india": "IN", "indonesia": "ID", "iran": "IR",
    "iraq": "IQ", "ireland": "IE", "israel": "IL", "italy": "IT", "japan": "JP",
    "jordan": "JO", "kazakhstan": "KZ", "kenya": "KE", "kuwait": "KW", "latvia": "LV",
    "lebanon": "LB", "libya": "LY", "liechtenstein": "LI", "lithuania": "LT", "luxembourg": "LU",
    "malaysia": "MY", "maldives": "MV", "malta": "MT", "mexico": "MX", "monaco": "MC",
    "mongolia": "MN", "montenegro": "ME", "morocco": "MA", "nepal": "NP", "netherlands": "NL",
    "new zealand": "NZ", "nigeria": "NG", "north korea": "KP", "north macedonia": "MK", "norway": "NO",
    "oman": "OM", "pakistan": "PK", "panama": "PA", "paraguay": "PY", "peru": "PE",
    "philippines": "PH", "poland": "PL", "portugal": "PT", "qatar": "QA", "romania": "RO",
    "russia": "RU", "saudi arabia": "SA", "serbia": "RS", "singapore": "SG", "slovakia": "SK",
    "slovenia": "SI", "south africa": "ZA", "south korea": "KR", "spain": "ES", "sri lanka": "LK",
    "sweden": "SE", "switzerland": "CH", "syria": "SY", "taiwan": "TW", "tajikistan": "TJ",
    "thailand": "TH", "tunisia": "TN", "turkey": "TR", "turkmenistan": "TM", "ukraine": "UA",
    "united arab emirates": "AE", "united kingdom": "GB", "united states": "US", "uruguay": "UY",
    "uzbekistan": "UZ", "vatican city": "VA", "venezuela": "VE", "vietnam": "VN", "yemen": "YE"
}

def get_country_code(country_name):
    print(f"Looking up country code for: {country_name}")
    try:
        # Normalize input: convert to lowercase and handle common variations
        normalized_name = country_name.lower().strip()
        
        # Handle common variations
        variations = {
            "usa": "united states",
            "uk": "united kingdom",
            "uae": "united arab emirates",
            "holland": "netherlands",
            "czechia": "czech republic",
            "england": "united kingdom"
        }
        
        # Check for variations first
        search_name = variations.get(normalized_name, normalized_name)
        
        # Look up the country code
        if search_name in COUNTRY_CODES:
            code = COUNTRY_CODES[search_name]
            print(f"Found country code: {code}")
            return code
        else:
            print(f"Error: No country code found for '{country_name}'")
            return None
            
    except Exception as e:
        print(f"Error looking up country code: {str(e)}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        country_name = sys.argv[1]
        try:
            code = get_country_code(country_name)
            if code:
                print(f"Country Code (alpha-2):{code}")
            else:
                print("Error: Failed to get country code")
                sys.exit(1)
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
