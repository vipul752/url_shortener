import { useState } from "react";
import axios from "axios";

export default function UrlForm({ setShortUrl, setShortId }) {
  const [url, setUrl] = useState("");

  const handleSubmit = async () => {
    const res = await axios.post("http://localhost:3000/shorten", {
      url,
    });

    setShortUrl(res.data.shortUrl);

    const id = res.data.shortUrl.split("/").pop();
    setShortId(id);
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

      <button
        onClick={handleSubmit}
        className="mt-4 w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
      >
        Shorten URL
      </button>
    </div>
  );
}
