import { useState } from "react";
import UrlForm from "./components/UrlForm";
import Stats from "./components/Stats";
import QRCodeBox from "./components/QRCodeBox";

export default function App() {
  const [shortUrl, setShortUrl] = useState("");
  const [shortId, setShortId] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-10">
      <h1 className="text-3xl font-semibold mb-8">URL Shortener</h1>

      <UrlForm setShortUrl={setShortUrl} setShortId={setShortId} />

      {shortUrl && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Short URL:</p>
          <a href={shortUrl} className="text-blue-600 hover:underline">
            {shortUrl}
          </a>
          <QRCodeBox url={shortUrl} />
        </div>
      )}

      {shortId && <Stats shortId={shortId} />}
    </div>
  );
}
