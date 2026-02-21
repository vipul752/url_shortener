import { nanoid } from "nanoid";
import URL from "../model/url.js";
import { redisClient } from "../config/redis.js";

const fetchLinkPreview = async (url) => {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await response.text();

    // Extract title
    const titleMatch =
      html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
      html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);

    // Extract image
    const imageMatch =
      html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i) ||
      html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : null,
      image: imageMatch ? imageMatch[1] : null,
    };
  } catch (error) {
    console.log("Error fetching link preview:", error.message);
    return { title: null, image: null };
  }
};

const shortenUrl = async (req, res) => {
  try {
    const { url, expiresIn, password } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const shortId = nanoid(6);

    let expiresAt = null;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    const preview = await fetchLinkPreview(url);

    await URL.create({
      shortUrl: shortId,
      originalUrl: url,
      expiresAt,
      password: password || null,
      title: preview.title,
      image: preview.image,
    });

    res.json({
      shortUrl: `${req.protocol}://${req.get("host")}/${shortId}`,
      expiresAt,
      hasPassword: !!password,
      title: preview.title,
      image: preview.image,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const bulkShortenUrl = async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "URLs array is required" });
    }

    if (urls.length > 100) {
      return res.status(400).json({ error: "Maximum 100 URLs allowed" });
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const shortId = nanoid(6);
          const preview = await fetchLinkPreview(url);

          await URL.create({
            shortUrl: shortId,
            originalUrl: url,
            title: preview.title,
            image: preview.image,
          });

          return {
            originalUrl: url,
            shortUrl: `${req.protocol}://${req.get("host")}/${shortId}`,
            title: preview.title,
            image: preview.image,
            success: true,
          };
        } catch (error) {
          return {
            originalUrl: url,
            error: "Failed to shorten",
            success: false,
          };
        }
      }),
    );

    res.json({ results });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get URL info (for password-protected links)
const getUrlInfo = async (req, res) => {
  try {
    const { shortId } = req.params;

    const urlEntry = await URL.findOne({ shortUrl: shortId });
    if (!urlEntry) {
      return res.status(404).json({ error: "URL not found" });
    }

    if (urlEntry.expiresAt && new Date() > urlEntry.expiresAt) {
      return res.status(410).json({ error: "This link has expired" });
    }

    res.json({
      hasPassword: !!urlEntry.password,
      title: urlEntry.title,
      image: urlEntry.image,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Verify password and get redirect URL
const verifyPassword = async (req, res) => {
  try {
    const { shortId } = req.params;
    const { password } = req.body;

    const urlEntry = await URL.findOne({ shortUrl: shortId });
    if (!urlEntry) {
      return res.status(404).json({ error: "URL not found" });
    }

    if (urlEntry.expiresAt && new Date() > urlEntry.expiresAt) {
      return res.status(410).json({ error: "This link has expired" });
    }

    if (urlEntry.password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    await URL.updateOne({ shortUrl: shortId }, { $inc: { clicks: 1 } });

    res.json({ originalUrl: urlEntry.originalUrl });
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
    let hasPassword = false;

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      originalUrl = parsed.originalUrl;
      hasPassword = parsed.hasPassword;

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
      hasPassword = !!urlEntry.password;

      const cacheData = JSON.stringify({
        originalUrl: urlEntry.originalUrl,
        expiresAt: urlEntry.expiresAt,
        hasPassword: !!urlEntry.password,
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

    if (hasPassword) {
      return res.redirect(
        `${process.env.CLIENT_URL || "http://localhost:5173"}/password/${shortId}`,
      );
    }

    await URL.updateOne({ shortUrl: shortId }, { $inc: { clicks: 1 } });

    res.redirect(originalUrl);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { shortenUrl, redirectUrl, bulkShortenUrl, getUrlInfo, verifyPassword };
