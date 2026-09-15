const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { isDisasterNews } = require('./llmService');
const cache = require('./cache');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REDDIT_USER_AGENT = 'web:oarfin-disaster-platform:v1.0 (by /u/oarfin_platform)';

const CACHE_KEYS = { BBC: 'bbc_news', NDTV: 'ndtv_news', REDDIT: 'reddit_news', GDACS_RSS: 'gdacs_rss' };
const REDDIT_CACHE = {};
const CACHE_TTL = { BBC: 300, NDTV: 300, REDDIT: 120, GDACS_RSS: 300 };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const xmlParser = new XMLParser({ cdataPropName: '__cdata', ignoreAttributes: false });
const rssText = (v) => (typeof v === 'object' ? v?.__cdata : v) || '';

async function fetchRssArticles(url, limit) {
  const res = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 10000 });
  const parsed = xmlParser.parse(res.data);
  const items = parsed?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : (items ? [items] : []);
  return list.slice(0, limit).map((item) => ({
    url: rssText(item.link).split('#')[0].split('?')[0],
    title: rssText(item.title),
    content: rssText(item.description),
  })).filter((a) => a.url && a.title);
}

// Fails OPEN, not closed: if the LLM relevance check errors (missing/invalid
// GEMINI_API_KEY, quota, network blip), the article is KEPT rather than
// dropped. A filter step that silently drops everything on every error
// turns "misconfigured API key" into "the news section is always empty" --
// which is a worse failure mode than occasionally showing an off-topic
// article. Logged once per run (not per-article) so a real misconfiguration
// is still loud in the logs without spamming them.
async function filterArticles(articles) {
  const filtered = [];
  let filterBroken = false;
  for (const article of articles) {
    try {
      if (filterBroken) { filtered.push(article); continue; }
      if ((await isDisasterNews(article)) === 'YES') {
        filtered.push(article);
      }
      await sleep(2000);
    } catch (err) {
      if (!filterBroken) {
        filterBroken = true;
        console.error('Disaster-relevance filter is failing (check GEMINI_API_KEY) -- serving articles unfiltered for this run:', err.message);
      }
      filtered.push(article);
    }
  }
  return filtered;
}

// Switched off headless-browser scraping entirely for both news sources --
// BBC's own future-planet page scrape worked locally (confirmed 17 real
// articles) but hung/never returned on Render even after fixing the
// missing-Chromium-binary issue, almost certainly because the --with-deps
// apt step (which installs Chromium's required system shared libraries)
// silently failed in Render's build sandbox and the postinstall's `|| true`
// fallback let the build continue anyway with a browser binary present but
// non-functional. Rather than keep fighting Playwright-on-Render, both
// sources now use their own public RSS feeds -- legitimate endpoints meant
// for automated consumption, not scraping around a block -- which also
// already include a per-article summary, so no per-article page visit is
// needed for either source anymore.
async function scrapeBBC() {
  const cached = cache.get(CACHE_KEYS.BBC);
  if (cached) return cached;

  const articles = await fetchRssArticles('https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', 15);
  const result = await filterArticles(articles);
  cache.set(CACHE_KEYS.BBC, result, CACHE_TTL.BBC);
  return result;
}

async function scrapeNDTV() {
  const cached = cache.get(CACHE_KEYS.NDTV);
  if (cached) return cached;

  const articles = await fetchRssArticles('https://feeds.feedburner.com/ndtvnews-world-news', 20);
  const result = await filterArticles(articles);
  cache.set(CACHE_KEYS.NDTV, result, CACHE_TTL.NDTV);
  return result;
}

// Reddit's own legacy Atom/RSS feed for a subreddit -- unlike the JSON API
// (oauth.reddit.com or reddit.com/*.json, both now gated behind Reddit
// login/app-review for automated traffic) this endpoint still serves plain
// XML to a normal User-Agent with zero authentication. Confirmed directly:
// reddit.com/r/<sub>/new/.rss returns 200 with real entries when both the
// OAuth app-creation flow (blocked on a "Responsible Builder Policy"
// registration step) and Pullpush (403s all automated requests now) were
// dead ends. Each entry's `content` field is an HTML snippet -- a "[link]"
// anchor to the external post URL (or self-post permalink) and sometimes an
// `<img>` thumbnail -- extracted here with regex since it's simple enough
// not to warrant a second HTML parser. No score/comment-count field exists
// in this feed format (Atom doesn't carry it), so those come back null.
const REDDIT_RSS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
// Atom's <content type="html">...</content> isn't CDATA-wrapped like the
// BBC/NDTV RSS 2.0 feeds -- fast-xml-parser turns it into
// { '@_type': 'html', '#text': '...' } instead, so the shared rssText()
// helper (which only checks __cdata) returns nothing for it and the raw
// object falls through to string methods and throws. This covers both
// shapes plus a plain string, for whichever field/feed format shows up.
function textOf(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.__cdata ?? v['#text'] ?? '';
  return String(v);
}
function decodeRssEntities(s) {
  return (s || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#32;/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}
async function fetchRedditViaRss(sub) {
  const res = await axios.get(`https://www.reddit.com/r/${sub}/new/.rss`, {
    headers: { 'User-Agent': REDDIT_RSS_USER_AGENT },
    timeout: 10000,
  });
  const parsed = xmlParser.parse(res.data);
  const entries = parsed?.feed?.entry;
  const list = Array.isArray(entries) ? entries : (entries ? [entries] : []);

  return list.map((entry) => {
    const redditLink = entry.link?.['@_href'] || `https://www.reddit.com/r/${sub}`;
    const decoded = decodeRssEntities(textOf(entry.content));
    const linkMatch = decoded.match(/<a href="([^"]+)">\[link\]<\/a>/);
    const imgMatch = decoded.match(/<img[^>]*src="([^"]+)"/);
    const postLink = linkMatch ? linkMatch[1] : redditLink;
    const isVideo = /v\.redd\.it|\.(mp4|webm)(\?|$)|youtube\.com|youtu\.be/i.test(postLink);
    // Image classification only from the post link's own extension (matches
    // the OAuth/Pullpush paths' logic) -- an external article that merely
    // has a thumbnail (imgMatch) is a link post, not an image post.
    const isImage = !isVideo && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(postLink);
    return {
      id: textOf(entry.id).replace('t3_', ''),
      title: textOf(entry.title),
      type: isVideo ? 'video' : (isImage ? 'image' : 'link'),
      post_link: postLink,
      reddit_link: redditLink,
      thumbnail: imgMatch ? imgMatch[1] : null,
      score: null,
      comments: null,
      created: entry.published || entry.updated || null,
      author: textOf(entry.author?.name).replace('/u/', ''),
      flair: '',
    };
  }).filter((p) => p.title);
}

// Reddit's own OAuth API (client-credentials grant -- app-only auth, no user
// login needed, sufficient for reading public subreddit listings). Requires
// REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET env vars from a "script" app created
// at reddit.com/prefs/apps; until those are set this simply returns null and
// fetchReddit falls back to the RSS path below unchanged.
let redditToken = null;
async function getRedditAccessToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (redditToken && redditToken.expiresAt > Date.now() + 30000) {
    return redditToken.accessToken;
  }

  const res = await axios.post(
    'https://www.reddit.com/api/v1/access_token',
    'grant_type=client_credentials',
    {
      auth: { username: clientId, password: clientSecret },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': REDDIT_USER_AGENT },
      timeout: 8000,
    }
  );
  redditToken = {
    accessToken: res.data.access_token,
    expiresAt: Date.now() + (res.data.expires_in || 3600) * 1000,
  };
  return redditToken.accessToken;
}

async function fetchRedditViaOAuth(sub) {
  const token = await getRedditAccessToken();
  if (!token) return null;
  const res = await axios.get(`https://oauth.reddit.com/r/${sub}/new`, {
    params: { limit: 25 },
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': REDDIT_USER_AGENT },
    timeout: 10000,
  });
  return (res.data?.data?.children || []).map(({ data: post }) => ({
    id: post.id,
    title: post.title,
    type: post.is_video ? 'video' : (/\.(jpg|jpeg|png|gif|webp)$/i.test(post.url || '') ? 'image' : 'link'),
    post_link: post.url,
    reddit_link: 'https://reddit.com' + post.permalink,
    thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
    score: post.score,
    comments: post.num_comments,
    created: new Date((post.created_utc || 0) * 1000).toISOString(),
    author: post.author,
    flair: post.link_flair_text || '',
  })).filter(p => p.title);
}

async function fetchReddit(sub) {
  sub = sub || 'DisasterUpdate';
  const cacheKey = 'reddit_' + sub;
  const staleKey = cacheKey + '_stale';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // RSS first: no credentials needed and confirmed working right now, unlike
  // both alternatives below (OAuth needs a Reddit "script" app, which the
  // app-creation flow itself has been blocking on; Pullpush 403s everything).
  try {
    const posts = await fetchRedditViaRss(sub);
    if (posts.length > 0) {
      cache.set(cacheKey, posts, CACHE_TTL.REDDIT);
      cache.set(staleKey, posts, 21600);
      return posts;
    }
  } catch (err) {
    console.warn('Reddit RSS fetch failed, trying OAuth next:', err.message);
  }

  // OAuth next, if credentials happen to be configured -- more complete data
  // (score/comment counts) than RSS when it's available.
  try {
    const posts = await fetchRedditViaOAuth(sub);
    if (posts) {
      cache.set(cacheKey, posts, CACHE_TTL.REDDIT);
      cache.set(staleKey, posts, 21600);
      return posts;
    }
  } catch (err) {
    console.warn('Reddit OAuth fetch failed, falling back to Pullpush:', err.response?.data?.message || err.message);
  }

  // Pullpush (Reddit archive API) is a free public service with an aggressive,
  // often-shared rate limit -- a 429 there is common and not something we can
  // eliminate outright, so we retry once with backoff, and if it still fails
  // we serve the last known-good result (kept around much longer than the
  // normal cache TTL) instead of surfacing a raw error to the UI.
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await sleep(1500);
      const response = await axios.get('https://api.pullpush.io/reddit/search/submission/?subreddit=' + sub + '&size=25&sort=desc', {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        timeout: 10000,
      });

      const posts = (response.data.data || []).map((post) => ({
        id: post.id,
        title: post.title,
        type: post.is_video ? 'video' : (/\.(jpg|jpeg|png|gif|webp)$/i.test(post.url || '') ? 'image' : 'link'),
        post_link: post.url,
        reddit_link: 'https://reddit.com' + post.permalink,
        thumbnail: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
        score: post.score,
        comments: post.num_comments,
        created: new Date((post.created_utc || 0) * 1000).toISOString(),
        author: post.author,
        flair: post.link_flair_text || '',
      })).filter(p => p.title);

      cache.set(cacheKey, posts, CACHE_TTL.REDDIT);
      cache.set(staleKey, posts, 21600); // 6h fallback, survives Pullpush being down/rate-limited
      return posts;
    } catch (err) {
      lastErr = err;
    }
  }

  const stale = cache.get(staleKey);
  if (stale) return stale;

  // Pullpush now actively refuses automated/server-side traffic outright
  // ("This website does not provide free scraping resources for agents")
  // rather than just occasionally rate-limiting -- surface that distinctly
  // so the controller/frontend can show a calm "unavailable" state instead
  // of a generic server-error message.
  const upstreamBlocked = lastErr?.response?.status === 429;
  const err = new Error(upstreamBlocked
    ? 'Reddit archive service is currently rate-limiting/blocking automated requests'
    : (lastErr?.message || 'Failed to reach Reddit archive service'));
  err.upstreamUnavailable = true;
  throw err;
}


module.exports = { scrapeBBC, scrapeNDTV, fetchReddit };
