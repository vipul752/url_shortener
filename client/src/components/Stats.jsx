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
    <div className="mt-6 bg-gray-800 p-4 rounded">
      <h2 className="text-xl font-bold">📊 Stats</h2>
      <p>Total Clicks: {stats.totalClicks}</p>
    </div>
  );
}
