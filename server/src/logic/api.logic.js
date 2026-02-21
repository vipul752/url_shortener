import { nanoid } from "nanoid";
import URL from "../model/url.js";
import { redisClient } from "../config/redis.js";

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

    await URL.updateOne({ shortUrl: shortId }, { $inc: { clicks: 1 } });

    res.redirect(originalUrl);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { shortenUrl, redirectUrl };
