import { useState, useEffect } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://url-shortener-2qnh.onrender.com";

export default function LinkDashboard({
  userId,
  onViewAnalytics,
  refreshTrigger,
}) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [totalClicks, setTotalClicks] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  const fetchLinks = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/user/${userId}/links?sortBy=${sortBy}&order=${order}`,
      );
      setLinks(res.data.links);
      setTotalClicks(res.data.totalClicks);
    } catch (error) {
      console.error("Error fetching links:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, [userId, sortBy, order, refreshTrigger]);

  const handleDelete = async (shortId) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      await axios.delete(`${API_URL}/link/${shortId}`, {
        data: { userId },
      });
      fetchLinks();
    } catch (error) {
      alert("Error deleting link");
    }
  };

  const copyToClipboard = async (url, shortId) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(shortId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl text-center py-8">
        <p className="text-gray-500">Loading your links...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-500">Total Links</p>
          <p className="text-2xl font-bold text-blue-600">{links.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-500">Total Clicks</p>
          <p className="text-2xl font-bold text-green-600">{totalClicks}</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-4 mb-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="createdAt">Sort by Date</option>
          <option value="clicks">Sort by Clicks</option>
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Links List */}
      {links.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
          <p className="text-gray-500">
            No links yet. Create your first short URL!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link) => (
            <div
              key={link.shortId}
              className={`bg-white p-4 rounded-lg shadow border ${
                link.isExpired ? "border-red-200 bg-red-50" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={link.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium truncate"
                    >
                      {link.shortUrl}
                    </a>
                    <button
                      onClick={() =>
                        copyToClipboard(link.shortUrl, link.shortId)
                      }
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {copiedId === link.shortId ? "Copied!" : "Copy"}
                    </button>
                    {link.isExpired && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {link.originalUrl}
                  </p>
                  {link.title && (
                    <p className="text-sm text-gray-700 mt-1">{link.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">
                      {link.clicks}
                    </p>
                    <p className="text-xs text-gray-500">clicks</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>Created: {formatDate(link.createdAt)}</span>
                  <span>Last click: {formatDate(link.lastAccessedAt)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewAnalytics(link.shortId)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-600 hover:bg-blue-200 rounded"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => handleDelete(link.shortId)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
