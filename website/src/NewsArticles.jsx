import { useEffect, useState } from "react";
import axios from "axios";
import "./NewsArticles.css";

const GDACS_URL =
  "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?limit=30&eventlist=EQ,TC,FL,VO,DR,WF&alertlevel=Red,Orange,Green";

const EVENT_LABELS = { EQ: "Earthquake", FL: "Flood", TC: "Cyclone", VO: "Volcano", WF: "Wildfire", DR: "Drought" };
const ALERT_COLORS = { Red: "#D32F2F", Orange: "#E65100", Green: "#2E7D32" };

export default function NewsArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = () => {
    setLoading(true);
    setError(null);
    axios.get(GDACS_URL)
      .then((res) => {
        const features = res.data?.features || [];
        setArticles(features.map((f) => {
          const p = f.properties || {};
          return {
            id: p.eventid || Math.random(),
            title: p.htmldescription || p.title || "Unknown Event",
            content: `${EVENT_LABELS[p.eventtype] || p.eventtype} — Alert level: ${p.alertlevel || "N/A"}. ${p.description || ""}`.trim(),
            url: `https://www.gdacs.org/report.aspx?eventtype=${p.eventtype}&eventid=${p.eventid}`,
            source: "GDACS",
            alertLevel: p.alertlevel || "Green",
            date: p.fromdate || p.eventdate || "",
          };
        }));
      })
      .catch(() => setError("Failed to load disaster news."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchArticles(); }, []);

  return (
    <div style={{ padding: "0" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Live Disaster News</h2>
        <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.3rem" }}>Real-time events from GDACS — Global Disaster Alert and Coordination System</p>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
          <div className="news-spinner"></div>
          <p>Loading disaster news...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{ background: "#fff3f3", border: "1px solid #ffcccc", borderLeft: "4px solid #D32F2F", borderRadius: 8, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ color: "#D32F2F" }}></i>
          <span style={{ fontSize: "0.9rem", color: "#555" }}>{error}</span>
          <button onClick={fetchArticles}
            style={{ marginLeft: "auto", padding: "0.35rem 0.9rem", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
          <p>No articles available at the moment.</p>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {articles.map((article) => (
            <div key={article.id}
              style={{ background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${ALERT_COLORS[article.alertLevel] || "#999"}`, borderRadius: 10, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, background: "#f3f4f6", color: "#555", padding: "0.15rem 0.5rem", borderRadius: 3, letterSpacing: "0.04em" }}>
                  {article.source}
                </span>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, background: ALERT_COLORS[article.alertLevel] || "#999", color: "#fff", padding: "0.15rem 0.5rem", borderRadius: 3, letterSpacing: "0.04em" }}>
                  {article.alertLevel}
                </span>
              </div>
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.5, margin: 0, flex: 1 }}>{article.title}</h3>
              <p style={{ fontSize: "0.83rem", color: "#666", lineHeight: 1.6, margin: 0 }}>{article.content}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                {article.date && (
                  <span style={{ fontSize: "0.75rem", color: "#999" }}>
                    <i className="fa-solid fa-calendar" style={{ marginRight: "0.3rem" }}></i>
                    {article.date.slice(0, 10)}
                  </span>
                )}
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.82rem", color: "#2563EB", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem", marginLeft: "auto" }}>
                  Read Full Story <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }}></i>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#999", textAlign: "right" }}>
          {articles.length} events from GDACS
        </div>
      )}
    </div>
  );
}
