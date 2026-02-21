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
    const { url, expiresIn, password, customAlias } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Check if custom alias is provided and valid
    let shortId;
    if (customAlias) {
      // Validate custom alias (alphanumeric, dashes, underscores only)
      if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
        return res.status(400).json({
          error:
            "Custom alias can only contain letters, numbers, dashes, and underscores",
        });
      }
      if (customAlias.length < 3 || customAlias.length > 20) {
        return res
          .status(400)
          .json({ error: "Custom alias must be 3-20 characters" });
      }
      // Check if alias is already taken
      const existing = await URL.findOne({ shortUrl: customAlias });
      if (existing) {
        return res
          .status(409)
          .json({ error: "This custom alias is already taken" });
      }
      shortId = customAlias;
    } else {
      shortId = nanoid(6);
    }

    let expiresAt = null;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    const preview = await fetchLinkPreview(url);

    const newUrl = await URL.create({
      shortUrl: shortId,
      originalUrl: url,
      customAlias: customAlias || null,
      userId: req.user?.id || null,
      expiresAt,
      password: password || null,
      title: preview.title,
      image: preview.image,
    });

    res.json({
      shortUrl: `${req.protocol}://${req.get("host")}/${shortId}`,
      shortId,
      expiresAt,
      hasPassword: !!password,
      title: preview.title,
      image: preview.image,
      createdAt: newUrl.createdAt,
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
            userId: req.user?.id || null,
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

    await URL.updateOne(
      { shortUrl: shortId },
      {
        $inc: { clicks: 1 },
        $push: { clickHistory: { timestamp: new Date() } },
        $set: { lastAccessedAt: new Date() },
      },
    );

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
        `${process.env.CLIENT_URL || "https://url-shortener-lilac-five.vercel.app"}/password/${shortId}`,
      );
    }

    await URL.updateOne(
      { shortUrl: shortId },
      {
        $inc: { clicks: 1 },
        $push: { clickHistory: { timestamp: new Date() } },
        $set: { lastAccessedAt: new Date() },
      },
    );

    res.redirect(originalUrl);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all links for a user (Dashboard)
const getUserLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sortBy = "createdAt", order = "desc" } = req.query;

    const sortOrder = order === "asc" ? 1 : -1;
    const sortField = sortBy === "clicks" ? "clicks" : "createdAt";

    const links = await URL.find({ userId })
      .select(
        "shortUrl originalUrl title image clicks createdAt lastAccessedAt expiresAt customAlias",
      )
      .sort({ [sortField]: sortOrder });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formattedLinks = links.map((link) => ({
      shortId: link.shortUrl,
      shortUrl: `${baseUrl}/${link.shortUrl}`,
      originalUrl: link.originalUrl,
      title: link.title,
      image: link.image,
      clicks: link.clicks,
      createdAt: link.createdAt,
      lastAccessedAt: link.lastAccessedAt,
      expiresAt: link.expiresAt,
      customAlias: link.customAlias,
      isExpired: link.expiresAt ? new Date() > link.expiresAt : false,
    }));

    res.json({
      links: formattedLinks,
      totalLinks: formattedLinks.length,
      totalClicks: formattedLinks.reduce((sum, link) => sum + link.clicks, 0),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get analytics for a specific link
const getLinkAnalytics = async (req, res) => {
  try {
    const { shortId } = req.params;
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const urlEntry = await URL.findOne({ shortUrl: shortId });
    if (!urlEntry) {
      return res.status(404).json({ error: "URL not found" });
    }

    // Verify ownership
    if (urlEntry.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this link's analytics" });
    }

    // Calculate clicks per day for the chart
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Group clicks by date
    const clicksByDate = {};
    const clickHistory = urlEntry.clickHistory || [];

    // Initialize all dates in range with 0 clicks
    for (let i = 0; i <= parseInt(days); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      clicksByDate[dateKey] = 0;
    }

    // Count clicks per date
    clickHistory.forEach((click) => {
      const clickDate = new Date(click.timestamp).toISOString().split("T")[0];
      if (clicksByDate.hasOwnProperty(clickDate)) {
        clicksByDate[clickDate]++;
      }
    });

    // Convert to array for Chart.js
    const chartData = Object.entries(clicksByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, clicks]) => ({
        date,
        clicks,
      }));

    res.json({
      shortId: urlEntry.shortUrl,
      originalUrl: urlEntry.originalUrl,
      title: urlEntry.title,
      totalClicks: urlEntry.clicks,
      createdAt: urlEntry.createdAt,
      lastAccessedAt: urlEntry.lastAccessedAt,
      chartData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a link
const deleteLink = async (req, res) => {
  try {
    const { shortId } = req.params;
    const userId = req.user.id;

    const urlEntry = await URL.findOne({ shortUrl: shortId });
    if (!urlEntry) {
      return res.status(404).json({ error: "URL not found" });
    }

    // Verify ownership
    if (urlEntry.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this link" });
    }

    await URL.deleteOne({ shortUrl: shortId });
    await redisClient.del(shortId);

    res.json({ message: "Link deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  shortenUrl,
  redirectUrl,
  bulkShortenUrl,
  getUrlInfo,
  verifyPassword,
  getUserLinks,
  getLinkAnalytics,
  deleteLink,
};
