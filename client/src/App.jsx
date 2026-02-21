import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import UrlForm from "./components/UrlForm";
import QRCodeBox from "./components/QRCodeBox";
import BulkUpload from "./components/BulkUpload";
import LinkPreview from "./components/LinkPreview";
import PasswordPage from "./components/PasswordPage";
import LinkDashboard from "./components/LinkDashboard";
import Analytics from "./components/Analytics";

export default function App() {
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState("single");
  const [passwordShortId, setPasswordShortId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [analyticsShortId, setAnalyticsShortId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check if we're on a password page
    const path = window.location.pathname;
    if (path.startsWith("/password/")) {
      setPasswordShortId(path.replace("/password/", ""));
    }

    // Get or create userId from localStorage
    let storedUserId = localStorage.getItem("urlShortenerUserId");
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem("urlShortenerUserId", storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewAnalytics = (shortId) => {
    setAnalyticsShortId(shortId);
    setActiveTab("analytics");
  };

  const handleBackFromAnalytics = () => {
    setAnalyticsShortId(null);
    setActiveTab("dashboard");
  };

  // Show password page if needed
  if (passwordShortId) {
    return <PasswordPage shortId={passwordShortId} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-10">
      <h1 className="text-3xl font-semibold mb-8">URL Shortener</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 rounded ${
            activeTab === "single"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Create Link
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-4 py-2 rounded ${
            activeTab === "bulk"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Bulk Upload
        </button>
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setAnalyticsShortId(null);
          }}
          className={`px-4 py-2 rounded ${
            activeTab === "dashboard" || activeTab === "analytics"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Your Links
        </button>
      </div>

      {activeTab === "single" && (
        <>
          <UrlForm
            setShortUrl={setShortUrl}
            setPreviewData={setPreviewData}
            userId={userId}
            onLinkCreated={handleLinkCreated}
          />

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

              {previewData?.hasPassword && (
                <p className="text-sm text-orange-600 mt-2">
                  🔒 Password protected
                </p>
              )}

              <LinkPreview
                title={previewData?.title}
                image={previewData?.image}
              />

              <QRCodeBox url={shortUrl} />
            </div>
          )}
        </>
      )}

      {activeTab === "bulk" && <BulkUpload />}

      {activeTab === "dashboard" && (
        <LinkDashboard
          userId={userId}
          onViewAnalytics={handleViewAnalytics}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === "analytics" && analyticsShortId && (
        <Analytics
          shortId={analyticsShortId}
          onBack={handleBackFromAnalytics}
        />
      )}
    </div>
  );
}
