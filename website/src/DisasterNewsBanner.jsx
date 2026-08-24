import { useEffect, useState, useRef } from "react";
import axios from "axios";

const GDACS_BANNER_URL =
  "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?limit=20&eventlist=EQ,TC,FL,VO,DR,WF&alertlevel=Red,Orange";

const ALERT_COLORS = { Red: "#D32F2F", Orange: "#E65100", Green: "#2E7D32" };
const EVENT_LABELS = { EQ: "Earthquake", FL: "Flood", TC: "Cyclone", VO: "Volcano", WF: "Wildfire", DR: "Drought" };

export default function DisasterNewsBanner() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const tickerRef = useRef(null);

  useEffect(() => {
    axios
      .get(GDACS_BANNER_URL)
      .then((res) => {
        // GDACS returns GeoJSON — features array
        const features = res.data?.features || res.data || [];
        const parsed = features
          .map((f) => {
            const p = f.properties || f;
            return {
              id: p.eventid || Math.random(),
              type: p.eventtype || "??",
              title: p.htmldescription || p.title || "Unknown event",
              alertLevel: p.alertlevel || "Green",
              date: p.fromdate || p.eventdate || "",
              link: `https://www.gdacs.org/report.aspx?eventtype=${p.eventtype}&eventid=${p.eventid}`,
            };
          })
          .filter((i) => i.title);
        setItems(parsed);
        setStatus(parsed.length ? "ok" : "empty");
      })
      .catch(() => setStatus("error"));
  }, []);

  // CSS marquee scroll
  const ticker = items.length
    ? items.map((item) => {
        const color = ALERT_COLORS[item.alertLevel] || "#616161";
        const label = EVENT_LABELS[item.type] || item.type;
        const date = item.date ? new Date(item.date).toLocaleDateString() : "";
        return (
          <span key={item.id} style={{ marginRight: "3rem", whiteSpace: "nowrap" }}>
            <span style={{ background: color, color: "#fff", fontSize: "0.68rem", fontWeight: 800, padding: "0.1rem 0.4rem", borderRadius: 2, marginRight: "0.4rem" }}>
              {item.alertLevel?.toUpperCase()}
            </span>
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}
              onMouseEnter={e => e.target.style.textDecoration = "underline"}
              onMouseLeave={e => e.target.style.textDecoration = "none"}>
              {label}: {item.title}
            </a>
            {date && <span style={{ color: "#aac4e0", fontSize: "0.78rem", marginLeft: "0.4rem" }}>{date}</span>}
            <span style={{ color: "#4a7aaa", marginLeft: "3rem" }}>|</span>
          </span>
        );
      })
    : null;

  return (
    <div style={{ background: "#1E3A5F", borderBottom: "2px solid #D32F2F", overflow: "hidden", height: 36, display: "flex", alignItems: "center" }}>
      {/* Label */}
      <div style={{ background: "#D32F2F", color: "#fff", fontSize: "0.72rem", fontWeight: 800, padding: "0 0.75rem", height: "100%", display: "flex", alignItems: "center", whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.04em" }}>
        ⚠ LIVE ALERTS
      </div>

      {/* Ticker */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {status === "loading" && (
          <div style={{ color: "#aac4e0", fontSize: "0.82rem", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "2px solid #aac4e0", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}></span>
            Fetching live disaster alerts...
          </div>
        )}
        {status === "error" && (
          <div style={{ color: "#ef9a9a", fontSize: "0.82rem", padding: "0 1rem" }}>
            Unable to load alerts. Check connection.
          </div>
        )}
        {status === "empty" && (
          <div style={{ color: "#aac4e0", fontSize: "0.82rem", padding: "0 1rem" }}>
            No active critical alerts at this time.
          </div>
        )}
        {status === "ok" && (
          <div ref={tickerRef} style={{ display: "inline-flex", animation: `marquee ${items.length * 6}s linear infinite`, paddingLeft: "100%" }}>
            {ticker}{ticker}
          </div>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
