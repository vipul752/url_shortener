import { useState } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://url-shortener-2qnh.onrender.com";

export default function UrlForm({ setShortUrl, setPreviewData }) {
  const [url, setUrl] = useState("");
  const [expiresIn, setExpiresIn] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/shorten`, {
        url,
        expiresIn: expiresIn ? parseInt(expiresIn) : null,
        password: password || null,
      });

      setShortUrl(res.data.shortUrl);
      setPreviewData({
        title: res.data.title,
        image: res.data.image,
        hasPassword: res.data.hasPassword,
      });
    } catch (error) {
      alert("Error shortening URL");
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
