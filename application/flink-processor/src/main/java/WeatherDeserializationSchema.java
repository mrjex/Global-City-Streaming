import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.io.IOException;
import org.apache.flink.api.common.serialization.DeserializationSchema;
import org.apache.flink.api.common.typeinfo.TypeInformation;

public class WeatherDeserializationSchema implements DeserializationSchema<Weather> {
  private static final long serialVersionUID = 1L;

  private transient ObjectMapper objectMapper;

  public WeatherDeserializationSchema() {
    // Initialize in the constructor for serialization
    this.objectMapper = JsonMapper.builder().build().registerModule(new JavaTimeModule());
  }

  @Override
  public Weather deserialize(byte[] message) throws IOException {
    if (objectMapper == null) {
      // Reinitialize if needed after serialization
      this.objectMapper = JsonMapper.builder().build().registerModule(new JavaTimeModule());
    }
    return objectMapper.readValue(message, Weather.class);
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