import { useEffect, useState } from "react";
import axios from "axios";

export default function Stats({ shortId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await axios.get(`http://localhost:3000/stats/${shortId}`);
      setStats(res.data);
    };

    fetchStats();
  }, [shortId]);

  if (!stats) return null;

  return (
    <div className="mt-6 bg-white p-4 rounded border border-gray-200 shadow">
      <h2 className="text-lg font-semibold text-gray-700">Stats</h2>
      <p className="text-gray-600">Total Clicks: {stats.totalClicks}</p>
    </div>
  );
}
