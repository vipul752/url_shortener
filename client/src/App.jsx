import { useState, useEffect } from "react";
import axios from "axios";
import UrlForm from "./components/UrlForm";
import QRCodeBox from "./components/QRCodeBox";
import BulkUpload from "./components/BulkUpload";
import LinkPreview from "./components/LinkPreview";
import PasswordPage from "./components/PasswordPage";
import LinkDashboard from "./components/LinkDashboard";
import Analytics from "./components/Analytics";
import AuthForm from "./components/AuthForm";

const API_URL =
  import.meta.env.VITE_API_URL || "https://url-shortener-2qnh.onrender.com";

export default function App() {
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState("single");
  const [passwordShortId, setPasswordShortId] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [analyticsShortId, setAnalyticsShortId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check if we're on a password page
    const path = window.location.pathname;
    if (path.startsWith("/password/")) {
      setPasswordShortId(path.replace("/password/", ""));
    }

    // Check if user is already logged in
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
      });
      setUser(res.data.user);
    } catch (error) {
      // User not logged in
      setUser(null);
    }
    setAuthLoading(false);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      setActiveTab("single");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
      {/* Header with auth */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">URL Shortener</h1>
        {!authLoading && (
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Hello, <span className="font-medium">{user.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveTab("auth")}
                className={`px-4 py-2 text-sm rounded ${
                  activeTab === "auth"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Login / Sign Up
              </button>
            )}
          </div>
        )}
      </div>

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
            if (user) {
              setActiveTab("dashboard");
              setAnalyticsShortId(null);
            } else {
              setActiveTab("auth");
            }
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

      {activeTab === "auth" && !user && (
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      )}

      {activeTab === "single" && (
        <>
          <UrlForm
            setShortUrl={setShortUrl}
            setPreviewData={setPreviewData}
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

              {!user && (
                <p className="text-sm text-blue-600 mt-3">
                  <button
                    onClick={() => setActiveTab("auth")}
                    className="underline hover:no-underline"
                  >
                    Login
                  </button>{" "}
                  to save this link to your dashboard
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

      {activeTab === "dashboard" && user && (
        <LinkDashboard
          onViewAnalytics={handleViewAnalytics}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === "analytics" && analyticsShortId && user && (
        <Analytics
          shortId={analyticsShortId}
          onBack={handleBackFromAnalytics}
        />
      )}
    </div>
  );
}
