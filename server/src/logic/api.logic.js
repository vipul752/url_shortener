import { nanoid } from "nanoid";
import { UAParser } from "ua-parser-js";
import URL from "../model/url.js";
import Stats from "../model/stats.js";
import { redisClient } from "../config/redis.js";
import { producer } from "../config/kafka.js";

const shortenUrl = async (req, res) => {
  try {
    const { url, expiresIn } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const shortId = nanoid(6);

    let expiresAt = null;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    await URL.create({ shortUrl: shortId, originalUrl: url, expiresAt });

    res.json({
      shortUrl: `${req.protocol}://${req.get("host")}/${shortId}`,
      expiresAt,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const redirectUrl = async (req, res) => {
  try {
    const { shortId } = req.params;

    const cachedData = await redisClient.get(shortId);
    let urlEntry;
    let originalUrl;

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      originalUrl = parsed.originalUrl;

      if (parsed.expiresAt && new Date() > new Date(parsed.expiresAt)) {
        await redisClient.del(shortId);
        return res.status(410).json({ error: "This link has expired" });
      }
    } else {
      urlEntry = await URL.findOne({ shortUrl: shortId });

      if (!urlEntry) {
        return res.status(404).json({ error: "URL not found" });
      }

      if (urlEntry.expiresAt && new Date() > urlEntry.expiresAt) {
        return res.status(410).json({ error: "This link has expired" });
      }

      originalUrl = urlEntry.originalUrl;

      const cacheData = JSON.stringify({
        originalUrl: urlEntry.originalUrl,
        expiresAt: urlEntry.expiresAt,
      });

      if (urlEntry.expiresAt) {
        const ttl = Math.floor(
          (new Date(urlEntry.expiresAt) - Date.now()) / 1000,
        );
        if (ttl > 0) {
          await redisClient.set(shortId, cacheData, { EX: ttl });
        }
      } else {
        await redisClient.set(shortId, cacheData, { EX: 3600 });
      }
    }

    const parser = new UAParser(req.headers["user-agent"]);
    const browser = parser.getBrowser().name || "Unknown";
    const os = parser.getOS().name || "Unknown";
    const device = parser.getDevice().type || "desktop";
    const referrer = req.headers.referer || req.headers.referrer || "Direct";

    await producer.send({
      topic: "click-events",
      messages: [
        {
          value: JSON.stringify({
            shortId,
            timestamp: Date.now(),
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            referrer,
            browser,
            os,
            device,
          }),
        },
      ],
    });

    await URL.updateOne({ shortUrl: shortId }, { $inc: { clicks: 1 } });

    res.redirect(originalUrl);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const statShortURL = async (req, res) => {
  try {
    const { shortId } = req.params;

    const urlEntry = await URL.findOne({ shortUrl: shortId });
    if (!urlEntry) {
      return res.status(404).json({ error: "URL not found" });
    }

    const totalClicks = await Stats.countDocuments({ shortId });

    const clickHistory = await Stats.find({ shortId })
      .sort({ timestamp: -1 })
      .limit(50)
      .select("timestamp browser os device referrer -_id");

    // Aggregate by browser
    const browserStats = await Stats.aggregate([
      { $match: { shortId } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Aggregate by OS
    const osStats = await Stats.aggregate([
      { $match: { shortId } },
      { $group: { _id: "$os", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Aggregate by device type
    const deviceStats = await Stats.aggregate([
      { $match: { shortId } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Aggregate by referrer
    const referrerStats = await Stats.aggregate([
      { $match: { shortId } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Clicks over time (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const clicksOverTime = await Stats.aggregate([
      { $match: { shortId, timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      shortId,
      originalUrl: urlEntry.originalUrl,
      createdAt: urlEntry.createdAt,
      expiresAt: urlEntry.expiresAt,
      totalClicks,
      clickHistory,
      browserStats,
      osStats,
      deviceStats,
      referrerStats,
      clicksOverTime,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { shortenUrl, redirectUrl, statShortURL };
