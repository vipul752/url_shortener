import { useEffect, useState } from "react";
import axios from "axios";

export default function Stats({ shortId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:3000/stats/${shortId}`);
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats");
      }
      setLoading(false);
    };

    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [shortId]);

  if (loading && !stats) {
    return (
      <div className="mt-6 bg-white p-4 rounded border border-gray-200 shadow w-full max-w-2xl">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="mt-6 bg-white p-6 rounded border border-gray-200 shadow w-full max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Analytics Dashboard
      </h2>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-500">Total Clicks</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalClicks}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-500">Created</p>
          <p className="text-sm font-medium text-green-600">
            {new Date(stats.createdAt).toLocaleDateString()}
          </p>
          {stats.expiresAt && (
            <p className="text-xs text-gray-400">
              Expires: {new Date(stats.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Browsers */}
        <div className="border rounded p-3">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Browsers</h3>
          {stats.browserStats?.length > 0 ? (
            <ul className="text-sm">
              {stats.browserStats.slice(0, 5).map((b, i) => (
                <li key={i} className="flex justify-between text-gray-600">
                  <span>{b._id || "Unknown"}</span>
                  <span className="text-gray-400">{b.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No data yet</p>
          )}
        </div>

        {/* OS */}
        <div className="border rounded p-3">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Operating Systems
          </h3>
          {stats.osStats?.length > 0 ? (
            <ul className="text-sm">
              {stats.osStats.slice(0, 5).map((o, i) => (
                <li key={i} className="flex justify-between text-gray-600">
                  <span>{o._id || "Unknown"}</span>
                  <span className="text-gray-400">{o.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No data yet</p>
          )}
        </div>

        {/* Devices */}
        <div className="border rounded p-3">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Devices</h3>
          {stats.deviceStats?.length > 0 ? (
            <ul className="text-sm">
              {stats.deviceStats.map((d, i) => (
                <li key={i} className="flex justify-between text-gray-600">
                  <span>{d._id || "Desktop"}</span>
                  <span className="text-gray-400">{d.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No data yet</p>
          )}
        </div>

        {/* Referrers */}
        <div className="border rounded p-3">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Top Referrers
          </h3>
          {stats.referrerStats?.length > 0 ? (
            <ul className="text-sm">
              {stats.referrerStats.slice(0, 5).map((r, i) => (
                <li key={i} className="flex justify-between text-gray-600">
                  <span className="truncate max-w-32">{r._id || "Direct"}</span>
                  <span className="text-gray-400">{r.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Clicks Over Time */}
      {stats.clicksOverTime?.length > 0 && (
        <div className="mt-4 border rounded p-3">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Clicks (Last 7 Days)
          </h3>
          <div className="flex items-end gap-1 h-20">
            {stats.clicksOverTime.map((day, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div
                  className="bg-blue-500 w-full rounded-t"
                  style={{
                    height: `${Math.max(4, (day.count / Math.max(...stats.clicksOverTime.map((d) => d.count))) * 60)}px`,
                  }}
                />
                <span className="text-xs text-gray-400 mt-1">
                  {day._id.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Clicks */}
      {stats.clickHistory?.length > 0 && (
        <div className="mt-4 border rounded p-3">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Recent Clicks
          </h3>
          <div className="max-h-32 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-1">Time</th>
                  <th className="pb-1">Browser</th>
                  <th className="pb-1">Device</th>
                </tr>
              </thead>
              <tbody>
                {stats.clickHistory.slice(0, 10).map((click, i) => (
                  <tr key={i} className="text-gray-600 border-t">
                    <td className="py-1">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                    <td className="py-1">{click.browser || "Unknown"}</td>
                    <td className="py-1">{click.device || "Desktop"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
