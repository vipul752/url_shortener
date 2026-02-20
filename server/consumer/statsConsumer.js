import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import Stats from "../src/model/stats.js";
import connectDB from "../src/config/db.js";

connectDB();

dotenv.config();

const kafka = new Kafka({
  clientId: "stats-consumer",
  brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: "analytics-group" });

await consumer.connect();
await consumer.subscribe({ topic: "click-events" });

await consumer.run({
  eachMessage: async ({ message }) => {
    const data = JSON.parse(message.value.toString());
    await Stats.create({
      shortId: data.shortId,
      timestamp: new Date(data.timestamp),
      ip: data.ip,
      userAgent: data.userAgent,
      referrer: data.referrer,
      browser: data.browser,
      os: data.os,
      device: data.device,
    });
    console.log("Saved stats for:", data.shortId);
  },
});
