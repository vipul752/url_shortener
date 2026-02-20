import { useState } from "react";
import UrlForm from "./components/UrlForm";
import Stats from "./components/Stats";
import QRCodeBox from "./components/QRCodeBox";

export default function App() {
  const [shortUrl, setShortUrl] = useState("");
  const [shortId, setShortId] = useState("");

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-10">
      <h1 className="text-4xl font-bold mb-8">🚀 URL Shortener</h1>

      <UrlForm setShortUrl={setShortUrl} setShortId={setShortId} />

      {shortUrl && (
        <div className="mt-6">
          <p className="text-lg">Short URL:</p>
          <a href={shortUrl} className="text-blue-400">
            {shortUrl}
          </a>
          <QRCodeBox url={shortUrl} />
        </div>
      )}

      {shortId && <Stats shortId={shortId} />}
    </div>
  );
}
