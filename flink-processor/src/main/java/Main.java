import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.connector.jdbc.JdbcExecutionOptions;
import org.apache.flink.connector.jdbc.JdbcSink;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.kafka.common.TopicPartition;

import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.api.common.functions.MapFunction;

import java.io.IOException; 
import java.net.URI; 
import java.net.URISyntaxException; 
import java.nio.file.Paths;

import java.nio.file.*;
import java.io.*;
import java.nio.channels.FileChannel;
import java.nio.ByteBuffer;
import static java.nio.file.StandardOpenOption.*;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Properties;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.yaml.snakeyaml.Yaml;
import java.io.InputStream;
import java.io.FileInputStream;
import java.util.Map;

public class Main {

    static final String BROKERS = "kafka:9092";
    static Integer sampleDuration;
    static Integer batchSize;
    static Integer batchIntervalMs;
    static Integer maxRetries;
    static Double requestInterval;
    static Integer staticCitiesCount;
    static Integer dynamicCitiesCount;
    static final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    // Load configuration from YAML
    static {
        try {
            Yaml yaml = new Yaml();
            InputStream inputStream = new FileInputStream("/app/configuration.yml");
            Map<String, Object> config = yaml.load(inputStream);
            
            Map<String, Object> services = (Map<String, Object>) config.get("services");
            Map<String, Object> flinkProcessor = (Map<String, Object>) services.get("flinkProcessor");
            Map<String, Object> kafkaProducer = (Map<String, Object>) services.get("kafkaProducer");
            Map<String, Object> cityApi = (Map<String, Object>) services.get("cityApi");
            
            // Load Flink processor settings
            sampleDuration = (Integer) flinkProcessor.get("sampleDuration");
            batchSize = (Integer) flinkProcessor.get("batchSize");
            batchIntervalMs = (Integer) flinkProcessor.get("batchIntervalMs");
            maxRetries = (Integer) flinkProcessor.get("maxRetries");
            
            // Load Kafka producer settings
            requestInterval = (Double) kafkaProducer.get("requestInterval");
            
            // Count static cities
            java.util.List<String> staticCities = (java.util.List<String>) config.get("cities");
            staticCitiesCount = staticCities != null ? staticCities.size() : 0;
            
            // Get dynamic cities count from cityApi config
            dynamicCitiesCount = (Integer) cityApi.get("numberOfCitiesForSelectedCountry");
            
            System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Loaded configuration: " +
                             "sampleDuration=" + sampleDuration + ", " +
                             "batchSize=" + batchSize + ", " +
                             "batchIntervalMs=" + batchIntervalMs + ", " +
                             "maxRetries=" + maxRetries);
        } catch (Exception e) {
            System.err.println("Failed to load configuration, using defaults");
            e.printStackTrace();
            // Default values if configuration fails to load
            sampleDuration = 15;
            batchSize = 1000;
            batchIntervalMs = 200;
            maxRetries = 5;
            requestInterval = 0.01;
            staticCitiesCount = 24;
            dynamicCitiesCount = 5;
        }
    }

    public static void main(String[] args) throws Exception {
      // Write execution settings once at startup
      writeExecutionSettings();
      
      StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

      System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Environment created");
      
      // Replace KafkaSource with FlinkKafkaConsumer
      Properties properties = new Properties();
      properties.setProperty("bootstrap.servers", BROKERS);
      properties.setProperty("group.id", "groupdId-919292");
      properties.setProperty("auto.offset.reset", "earliest");
      
      FlinkKafkaConsumer<Weather> consumer = new FlinkKafkaConsumer<>(
          "weather", 
          new WeatherDeserializationSchema(), 
          properties
      );

      DataStreamSource<Weather> kafka = env.addSource(consumer);

      System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Kafka source created");

      // Add logging for raw data from Kafka
      kafka.map(weather -> {
        System.out.println("[" + dtf.format(LocalDateTime.now()) + "] 🌡️ Raw Weather Data Received:");
        System.out.println("    📍 City: " + weather.city);
        System.out.println("    🌡️ Temperature: " + weather.temperature + "°C");
        System.out.println("    ⏰ Timestamp: " + dtf.format(LocalDateTime.now()));
        System.out.println("    " + "=".repeat(50));
        return weather;
      });

      DataStream<Tuple2<MyAverage, Double>> averageTemperatureStream = kafka.keyBy(myEvent -> myEvent.city)
        .window(TumblingProcessingTimeWindows.of(Time.seconds(sampleDuration)))
        .aggregate(new AverageAggregator());

      DataStream<Tuple2<String, Double>> cityAndValueStream = averageTemperatureStream
        .map(new MapFunction<Tuple2<MyAverage, Double>, Tuple2<String, Double>>() {
          @Override
          public Tuple2<String, Double> map(Tuple2<MyAverage, Double> input) throws Exception {
            System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Aggregated data: City=" + input.f0.city + 
                             ", Count=" + input.f0.count + ", Sum=" + input.f0.sum + ", Average=" + input.f1);
            return new Tuple2<>(input.f0.city, input.f1);
          }
        }); 

      System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Aggregation created");
      

      // cityAndValueStream.print();
      cityAndValueStream.addSink(JdbcSink.sink("insert into weather (city, average_temperature) values (?, ?)",
            (statement, event) -> {
              System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Inserting into DB: City=" + event.f0 + 
                               ", Average Temperature=" + event.f1);
              statement.setString(1, event.f0);
              statement.setDouble(2, event.f1);
            },
            JdbcExecutionOptions.builder()
                .withBatchSize(batchSize)
                .withBatchIntervalMs(batchIntervalMs)
                .withMaxRetries(maxRetries)
                .build(),
            new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
              .withUrl("jdbc:postgresql://postgres:5432/postgres")
              .withDriverName("org.postgresql.Driver")
              .withUsername("postgres")
              .withPassword("postgres")
              .build()
      ));

      env.execute("Kafka-flink-postgres");
    }

    /**
     * Writes the execution settings to the monitoring file, overriding any existing content
     */
    public static void writeExecutionSettings() {
      // Calculate metrics
      int totalCities = staticCitiesCount + dynamicCitiesCount;
      double cycleTime = totalCities * requestInterval;
      double messagesPerSecond = totalCities / cycleTime;
      double maxProcessingRate = (double) batchSize / (batchIntervalMs / 1000.0);

      String content = "-- -- - EXECUTION SETTINGS AND METRICS - -- -- \n\n" +
                      "KAFKA PRODUCER METRICS:\n" +
                      "- Total Cities Processed: " + totalCities + " (" + staticCitiesCount + " static + " + dynamicCitiesCount + " dynamic)\n" +
                      "- Request Interval: " + requestInterval + " seconds\n" +
                      "- Messages per Second: " + String.format("%.2f", messagesPerSecond) + " (" + totalCities + " cities / " + String.format("%.2f", cycleTime) + " seconds cycle)\n\n" +
                      "FLINK PROCESSOR METRICS:\n" +
                      "- Batch Size: " + batchSize + " records\n" +
                      "- Batch Interval: " + batchIntervalMs + "ms\n" +
                      "- Maximum Theoretical Processing Rate: " + String.format("%.2f", maxProcessingRate) + " records/second\n" +
                      "- Actual Processing Rate: " + String.format("%.2f", messagesPerSecond) + " records/second (limited by producer rate)\n" +
                      "- Sample Duration: " + sampleDuration + " seconds\n" +
                      "- Max Retries: " + maxRetries + "\n\n" +
                      "POSTGRES DATABASE:\n" +
                      "- Actual Insertion Rate: " + String.format("%.2f", messagesPerSecond) + " records/second (matches input rate from Kafka)\n\n" +
                      "Note: All rates are theoretical maximums under ideal conditions. Actual rates may vary due to network latency, processing overhead, and system factors.";
      
      try {
        File file = new File("/app/shared/monitoring/exec-settings.txt");
        // Ensure parent directories exist
        file.getParentFile().mkdirs();
        // Write to file (override mode)
        FileWriter fw = new FileWriter(file, false);
        fw.write(content);
        fw.close();
      } catch (IOException e) {
        System.out.println("ERROR: Failed to write to monitoring file: " + e.getMessage());
        e.printStackTrace();
      }
    }

    /**
     * Aggregation function for average.
     */
    public static class AverageAggregator implements AggregateFunction<Weather, MyAverage, Tuple2<MyAverage, Double>> {

        @Override
        public MyAverage createAccumulator() {
            return new MyAverage();
        }

        @Override
        public MyAverage add(Weather weather, MyAverage myAverage) {
            //logger.debug("add({},{})", myAverage.city, myEvent);
            myAverage.city = weather.city;
            myAverage.count = myAverage.count + 1;
            myAverage.sum = myAverage.sum + weather.temperature;
            return myAverage;
        }

        @Override
        public Tuple2<MyAverage, Double> getResult(MyAverage myAverage) {
            return new Tuple2<>(myAverage, myAverage.sum / myAverage.count);
        }

        @Override
        public MyAverage merge(MyAverage myAverage, MyAverage acc1) {
            myAverage.sum = myAverage.sum + acc1.sum;
            myAverage.count = myAverage.count + acc1.count;
            return myAverage;
        }
    }

    public static class MyAverage {

        public String city;
        public Integer count = 0;
        public Double sum = 0d;

        @Override
        public String toString() {
            return "MyAverage{" +
                    "city='" + city + '\'' +
                    ", count=" + count +
                    ", sum=" + sum +
                    '}';
        }
    }
}