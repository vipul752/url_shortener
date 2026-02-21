import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function PasswordPage({ shortId }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`${API_URL}/info/${shortId}`);
        setInfo(res.data);
      } catch (err) {
        setError("Link not found or expired");
      }
      setLoadingInfo(false);
    };
    fetchInfo();
  }, [shortId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/verify/${shortId}`, {
        password,
      });
      window.location.href = res.data.originalUrl;
    } catch (err) {
      setError(err.response?.data?.error || "Incorrect password");
      setLoading(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">
            Password Protected Link
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter the password to access this link
          </p>
        </div>

        {info?.title && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg text-center">
            {info.image && (
              <img
                src={info.image}
                alt={info.title}
                className="w-20 h-20 object-cover rounded mx-auto mb-2"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
            <p className="text-sm font-medium text-gray-700">{info.title}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-4 w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Verifying..." : "Access Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
