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
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
      <input
        type="text"
        placeholder="Enter URL"
        className="w-full p-3 rounded text-black"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="mt-4 w-full bg-blue-500 p-3 rounded"
      >
        Shorten URL
      </button>
    </div>
  );
}
