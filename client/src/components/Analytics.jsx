import { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const API_URL =
  import.meta.env.VITE_API_URL || "https://url-shortener-2qnh.onrender.com";

export default function Analytics({ shortId, onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [chartType, setChartType] = useState("line");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/analytics/${shortId}?days=${days}`,
          { withCredentials: true },
        );
        setAnalytics(res.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
      setLoading(false);
    };

    if (shortId) {
      fetchAnalytics();
    }
  }, [shortId, days]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl text-center py-8">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="w-full max-w-4xl text-center py-8">
        <p className="text-gray-500">Unable to load analytics</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  const chartData = {
    labels: analytics.chartData.map((d) =>
      new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    ),
    datasets: [
      {
        label: "Clicks",
        data: analytics.chartData.map((d) => d.clicks),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor:
          chartType === "line"
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.5)",
        fill: chartType === "line",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Clicks Over Last ${days} Days`,
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>

      {/* Link Info */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {analytics.title || "Untitled Link"}
        </h2>
        <a
          href={`${API_URL}/${analytics.shortId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          {API_URL}/{analytics.shortId}
        </a>
        <p className="text-sm text-gray-500 mt-1 truncate">
          {analytics.originalUrl}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-500">Total Clicks</p>
          <p className="text-3xl font-bold text-blue-600">
            {analytics.totalClicks}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-500">Created</p>
          <p className="text-sm font-medium text-gray-700">
            {formatDate(analytics.createdAt)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-500">Last Accessed</p>
          <p className="text-sm font-medium text-gray-700">
            {formatDate(analytics.lastAccessedAt)}
          </p>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex gap-4 mb-4">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>

        {/* Chart */}
        <div className="h-80">
          {chartType === "line" ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
}
