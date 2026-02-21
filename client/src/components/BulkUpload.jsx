import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function BulkUpload() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const urls = lines
        .map((line) => line.split(",")[0].trim())
        .filter((url) => url && url.startsWith("http"));

      if (urls.length === 0) {
        setError("No valid URLs found in the CSV file");
        setLoading(false);
        return;
      }

      const res = await axios.post(`${API_URL}/bulk-shorten`, { urls });
      setResults(res.data.results);
    } catch (err) {
      setError("Error processing URLs");
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    const csvContent = [
      "Original URL,Short URL,Title",
      ...results.map(
        (r) => `"${r.originalUrl}","${r.shortUrl || ""}","${r.title || ""}"`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shortened_urls.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow w-full max-w-2xl border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Bulk URL Shortener</h2>
      <p className="text-sm text-gray-500 mb-4">
        Upload a CSV file with URLs (one per line or in the first column)
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="w-full p-3 border border-gray-300 rounded cursor-pointer"
        disabled={loading}
      />

      {loading && (
        <div className="mt-4 text-center text-gray-600">Processing URLs...</div>
      )}

      {error && <div className="mt-4 text-red-500">{error}</div>}

      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">
              Results ({results.filter((r) => r.success).length}/
              {results.length} successful)
            </h3>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Download CSV
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.image && (
                    <img
                      src={result.image}
                      alt=""
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {result.title && (
                      <p className="font-medium text-sm truncate">
                        {result.title}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 truncate">
                      {result.originalUrl}
                    </p>
                    {result.success ? (
                      <a
                        href={result.shortUrl}
                        className="text-blue-600 hover:underline text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {result.shortUrl}
                      </a>
                    ) : (
                      <p className="text-red-500 text-sm">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
