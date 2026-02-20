import { nanoid } from "nanoid";
import URL from "../model/url.js";
import { redisClient } from "../config/redis.js";
import { producer } from "../config/kafka.js";

const shortenUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const shortId = nanoid(6);

    await URL.create({ shortUrl: shortId, originalUrl: url });

    res.json({ shortUrl: `${req.protocol}://${req.get("host")}/${shortId}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const redirectUrl = async (req, res) => {
  try {
    const { shortId } = req.params;

    const cachedURL = await redisClient.get(shortId);

    if (cachedURL) {
      return res.redirect(cachedURL);
    }

    const urlEntry = await URL.findOne({ shortUrl: shortId });

    if (!urlEntry) {
      return res.status(404).json({ error: "URL not found" });
    }

    await redisClient.set(shortId, urlEntry.originalUrl, { EX: 3600 }); // Cache for 1 hour
    console.log(shortId);
    console.log(req.ip);

    await producer.send({
      topic: "click-events",
      messages: [
        {
          value: JSON.stringify({
            shortId,
            timestamp: Date.now(),
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          }),
        },
      ],
    });
    console.log(req.ip);
    console.log(shortId);

    await URL.updateOne({ shortUrl: shortId }, { $inc: { clicks: 1 } });

    res.redirect(urlEntry.originalUrl);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const statShortURL = async (req, res) => {
  try {
    const { shortId } = req.params;

    const totalClicks = await Stats.countDocuments({ shortId });

    res.json({
      shortId,
      totalClicks,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { shortenUrl, redirectUrl, statShortURL };
