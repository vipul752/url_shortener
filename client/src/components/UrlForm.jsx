import { useState } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://url-shortener-2qnh.onrender.com";

export default function UrlForm({
  setShortUrl,
  setPreviewData,
  onLinkCreated,
}) {
  const [url, setUrl] = useState("");
  const [expiresIn, setExpiresIn] = useState("");
  const [password, setPassword] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_URL}/shorten`,
        {
          url,
          expiresIn: expiresIn ? parseInt(expiresIn) : null,
          password: password || null,
          customAlias: customAlias || null,
        },
        { withCredentials: true },
      );

      setShortUrl(res.data.shortUrl);
      setPreviewData({
        title: res.data.title,
        image: res.data.image,
        hasPassword: res.data.hasPassword,
      });

      // Notify parent that a new link was created
      if (onLinkCreated) {
        onLinkCreated();
      }

      // Clear form
      setUrl("");
      setCustomAlias("");
      setPassword("");
      setExpiresIn("");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Error shortening URL";
      setError(errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow w-full max-w-lg border border-gray-200">
      <input
        type="text"
        placeholder="Enter URL"
        className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div className="mt-3 relative">
        <span className="absolute left-3 top-3 text-gray-400 text-sm">
          short.ly/
        </span>
        <input
          type="text"
          placeholder="custom-alias (optional)"
          className="w-full p-3 pl-16 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={customAlias}
          onChange={(e) =>
            setCustomAlias(
              e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
            )
          }
          maxLength={20}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Leave empty for auto-generated. Only letters, numbers, dashes,
        underscores.
      </p>

      <input
        type="password"
        placeholder="Password (optional)"
        className="mt-3 w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select
        value={expiresIn}
        onChange={(e) => setExpiresIn(e.target.value)}
        className="mt-3 w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">No expiration</option>
        <option value="1">1 hour</option>
        <option value="24">24 hours</option>
        <option value="168">7 days</option>
        <option value="720">30 days</option>
      </select>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || !url}
        className="mt-4 w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Shortening..." : "Shorten URL"}
      </button>
    </div>
  );
}
