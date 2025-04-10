import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.io.IOException;
import org.apache.flink.api.common.serialization.DeserializationSchema;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.fasterxml.jackson.databind.DeserializationFeature;

public class WeatherDeserializationSchema implements DeserializationSchema<Weather> {
  private static final long serialVersionUID = 1L;
  private static final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

  private transient ObjectMapper objectMapper;

  public WeatherDeserializationSchema() {
    initializeObjectMapper();
  }

  private void initializeObjectMapper() {
    this.objectMapper = JsonMapper.builder()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        .build()
        .registerModule(new JavaTimeModule());
  }

  @Override
  public Weather deserialize(byte[] message) throws IOException {
    if (objectMapper == null) {
      initializeObjectMapper();
    }

    String jsonString = new String(message, StandardCharsets.UTF_8);
    try {
      System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Deserializing message: " + jsonString);
      Weather weather = objectMapper.readValue(jsonString, Weather.class);
      if (weather.city == null || weather.temperature == null) {
        System.err.println("[" + dtf.format(LocalDateTime.now()) + "] Warning: Deserialized Weather object is missing required fields");
        System.err.println("City: " + weather.city + ", Temperature: " + weather.temperature);
      } else {
        System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Successfully deserialized: " + weather.toString());
      }
      return weather;
    } catch (Exception e) {
      System.err.println("[" + dtf.format(LocalDateTime.now()) + "] Error deserializing message: " + jsonString);
      System.err.println("Error details: " + e.getMessage());
      throw new IOException("Failed to deserialize Weather data", e);
    }
  }

  @Override
  public boolean isEndOfStream(Weather nextElement) {
    return false; // We never end the stream
  }

  @Override
  public TypeInformation<Weather> getProducedType() {
    return TypeInformation.of(Weather.class);
  }
}