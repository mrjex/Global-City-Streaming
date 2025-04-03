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

public class Main {

    static final String BROKERS = "kafka:9092";
    static final Integer sampleDuration = 15; // Default: 60
    static final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

    public static void main(String[] args) throws Exception {
      appendToMountedFile();
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
        System.out.println("[" + dtf.format(LocalDateTime.now()) + "] Raw data received: " + weather.toString());
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
              .withBatchSize(1000)
              .withBatchIntervalMs(200)
              .withMaxRetries(5)
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
     * Appends the sample duration to the mounted docker-contained file '/dev-debug/exec-settings.txt'
     */
    public static void appendToMountedFile() {

      String outputText = String.format("Time Sampling Duration (seconds) = %2d", sampleDuration);
      
      try {
        File file = new File("./mnt/exec-settings.txt");
        FileWriter fr = new FileWriter(file, true);
        fr.write(outputText);
        fr.close();
      } catch (IOException e) {
        System.out.println("ERROR: flink-processor/Main.java, IOException when writing to mounted .txt file");
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