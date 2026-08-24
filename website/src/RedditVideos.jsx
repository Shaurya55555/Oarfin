import { useEffect, useState } from "react";
import "./RedditVideos.css";

const SUBREDDITS = ["DisasterUpdate", "worldnews", "NaturalDisasters"];

// Pullpush is a Reddit archive API with CORS enabled — works directly from browser
const fetchPosts = (sub) =>
  fetch(`https://api.pullpush.io/reddit/search/submission/?subreddit=${sub}&size=25&sort=desc`)
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((data) => (data.data || []).filter((p) => p.title).map((p) => ({
      id: p.id,
      title: p.title,
      type: p.is_video ? "video" : /\.(jpg|jpeg|png|gif|webp)$/i.test(p.url || "") ? "image" : "link",
      url: p.url,
      redditUrl: `https://reddit.com${p.permalink}`,
      thumbnail: p.thumbnail && p.thumbnail.startsWith("http") ? p.thumbnail : null,
      score: p.score || 0,
      comments: p.num_comments || 0,
      created: new Date((p.created_utc || 0) * 1000).toLocaleDateString(),
      flair: p.link_flair_text || "",
    })));

export default function RedditVideos() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSub, setActiveSub] = useState("DisasterUpdate");
  const [filter, setFilter] = useState("all");

  const load = (sub) => {
    setLoading(true);
    setError(null);
    fetchPosts(sub)
      .then(setPosts)
      .catch((e) => setError(e.message || "Failed to load posts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(activeSub); }, [activeSub]);

  const filtered = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="fa-brands fa-reddit" style={{ color: "#FF4500" }}></i> Disaster Updates from Reddit
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.3rem" }}>Community reports and updates from disaster-related subreddits</p>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {SUBREDDITS.map((sub) => (
            <button key={sub} onClick={() => setActiveSub(sub)}
              style={{ padding: "0.35rem 0.8rem", borderRadius: 4, border: "1px solid #ddd", background: activeSub === sub ? "#FF4500" : "#fff", color: activeSub === sub ? "#fff" : "#333", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
              r/{sub}
            </button>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", alignItems: "center" }}>
        {["all", "video", "image", "link"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "0.3rem 0.7rem", borderRadius: 4, border: "1px solid #ddd", background: filter === f ? "#1E3A5F" : "#fff", color: filter === f ? "#fff" : "#333", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
          </button>
        ))}
        {!loading && (
          <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "#999" }}>
            {filtered.length} posts • r/{activeSub}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
          <div className="reddit-spinner"></div>
          <p style={{ marginTop: "0.75rem" }}>Loading posts from r/{activeSub}...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderLeft: "4px solid #e65100", borderRadius: 8, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ color: "#e65100" }}></i>
          <span style={{ fontSize: "0.9rem", color: "#555" }}>{error}</span>
          <button onClick={() => load(activeSub)}
            style={{ marginLeft: "auto", padding: "0.3rem 0.75rem", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.82rem" }}>
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
          <i className="fa-solid fa-inbox" style={{ fontSize: "2rem", marginBottom: "0.75rem", display: "block" }}></i>
          <p>No {filter !== "all" ? filter : ""} posts found in r/{activeSub}</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((post) => (
            <div key={post.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
              {post.thumbnail && (
                <div style={{ position: "relative", height: 150, overflow: "hidden", background: "#f3f4f6" }}>
                  <img src={post.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                  {post.type === "video" && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                      <i className="fa-solid fa-play" style={{ color: "#fff", fontSize: "1.5rem" }}></i>
                    </div>
                  )}
                </div>
              )}
              <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                {post.flair && (
                  <span style={{ fontSize: "0.7rem", background: "#FF450018", color: "#FF4500", padding: "0.15rem 0.5rem", borderRadius: 3, fontWeight: 700, marginBottom: "0.5rem", display: "inline-block" }}>
                    {post.flair}
                  </span>
                )}
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.5, marginBottom: "0.75rem", flex: 1 }}>{post.title}</h3>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.78rem", color: "#888", marginBottom: "0.75rem" }}>
                  <span><i className="fa-solid fa-arrow-up"></i> {post.score}</span>
                  <span><i className="fa-solid fa-comment"></i> {post.comments}</span>
                  <span>{post.created}</span>
                </div>
                <a href={post.redditUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.82rem", color: "#FF4500", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  View on Reddit <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }}></i>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
