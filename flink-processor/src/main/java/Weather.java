import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Weather {

  /*
  {
    "city": "London",
    "country": "United Kingdom",
    "continent": "Europe",
    "temperatureCelsius": 15.2,
    "latitude": 51.5171,
    "longitude": -0.1062
  }
  */

  public String city;
  public String country;
  public String continent;
  
  @JsonProperty("temperatureCelsius")
  public Double temperature;
  
  public Double latitude;
  public Double longitude;

  public Weather() {}

  public Weather(String city, Double temperature) {
    this.city = city;
    this.temperature = temperature;
  }

  @Override
  public String toString() {
    final StringBuilder sb = new StringBuilder("Weather{");
    sb.append("city='").append(city).append('\'');
    sb.append(", country='").append(country).append('\'');
    sb.append(", continent='").append(continent).append('\'');
    sb.append(", temperature=").append(temperature);
    sb.append(", latitude=").append(latitude);
    sb.append(", longitude=").append(longitude);
    sb.append('}');
    return sb.toString();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Weather weather = (Weather) o;
    return Objects.equals(city, weather.city) && 
           Objects.equals(country, weather.country) &&
           Objects.equals(continent, weather.continent) &&
           Objects.equals(temperature, weather.temperature) &&
           Objects.equals(latitude, weather.latitude) &&
           Objects.equals(longitude, weather.longitude);
  }

  @Override
  public int hashCode() {
    return Objects.hash(city, country, continent, temperature, latitude, longitude);
  }
}