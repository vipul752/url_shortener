import { useState } from "react";
import UrlForm from "./components/UrlForm";
import QRCodeBox from "./components/QRCodeBox";

export default function App() {
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-10">
      <h1 className="text-3xl font-semibold mb-8">URL Shortener</h1>

      <UrlForm setShortUrl={setShortUrl} />

      {shortUrl && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Short URL:</p>
          <div className="flex items-center gap-2 mt-1">
            <a href={shortUrl} className="text-blue-600 hover:underline">
              {shortUrl}
            </a>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <QRCodeBox url={shortUrl} />
        </div>
      )}
    </div>
  );
}
