const { chromium } = require('playwright');
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

async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
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

// Capped + fetched concurrently across multiple pages/tabs in the same
// browser (was: sequential full navigations across all ~17 listing links).
// That sequential version, one page-load at a time, easily ran past
// Render's reverse-proxy request timeout on a cold cache -- the scrape
// itself would eventually finish, but the client (and Render's proxy)
// had already given up with a 502/503 well before it did.
const BBC_ARTICLE_LIMIT = 6;
const BBC_CONCURRENCY = 3;

async function scrapeBBC() {
  const cached = cache.get(CACHE_KEYS.BBC);
  if (cached) return cached;

  const browser = await launchBrowser();
  try {
    const listPage = await browser.newPage();
    await listPage.goto('https://bbc.com/future-planet', { waitUntil: 'domcontentloaded' });
    const articleUrls = (await listPage.$$eval(
      'a[href*="/news/articles"]',
      (links) => links.map((l) => l.href).filter((u) => u.includes('/news/articles'))
    )).slice(0, BBC_ARTICLE_LIMIT);
    await listPage.close();

    const articles = [];
    const queue = [...articleUrls];
    const worker = async () => {
      while (queue.length) {
        const url = queue.shift();
        const page = await browser.newPage();
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded' });
          const title = await page.title();
          const paragraphs = await page.$$eval('article p', (ps) =>
            ps.map((p) => p.textContent?.trim()).filter(Boolean)
          );
          articles.push({ url, title, content: paragraphs.join(' ') });
        } catch (err) {
          console.error(`Error scraping BBC article ${url}:`, err.message);
        } finally {
          await page.close();
        }
      }
    };
    await Promise.all(Array.from({ length: BBC_CONCURRENCY }, worker));

    const result = await filterArticles(articles);
    cache.set(CACHE_KEYS.BBC, result, CACHE_TTL.BBC);
    return result;
  } finally {
    await browser.close();
  }
}

const xmlParser = new XMLParser({ cdataPropName: '__cdata', ignoreAttributes: false });

// Switched from headless-browser scraping of ndtv.com/world to their public
// world-news RSS feed. The page itself now sits behind Akamai bot
// protection and returns a flat "Access Denied" (HTTP 200, no bot-check
// challenge to solve, just a hard block) to any headless-browser request
// regardless of wait strategy or user agent -- confirmed directly, not a
// stale-selector issue. The RSS feed is a normal public endpoint meant for
// automated consumption and isn't blocked, and already includes a
// description/summary per article, so no per-article page visit is needed.
async function scrapeNDTV() {
  const cached = cache.get(CACHE_KEYS.NDTV);
  if (cached) return cached;

  const res = await axios.get('https://feeds.feedburner.com/ndtvnews-world-news', {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10000,
  });
  const parsed = xmlParser.parse(res.data);
  const items = parsed?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : (items ? [items] : []);

  const text = (v) => (typeof v === 'object' ? v?.__cdata : v) || '';
  const articles = list.slice(0, 20).map((item) => ({
    url: text(item.link).split('#')[0],
    title: text(item.title),
    content: text(item.description),
  })).filter((a) => a.url && a.title);

  const result = await filterArticles(articles);
  cache.set(CACHE_KEYS.NDTV, result, CACHE_TTL.NDTV);
  return result;
}

// Reddit's own OAuth API (client-credentials grant -- app-only auth, no user
// login needed, sufficient for reading public subreddit listings). Requires
// REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET env vars from a "script" app created
// at reddit.com/prefs/apps; until those are set this simply returns null and
// fetchReddit falls back to the Pullpush path below unchanged.
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

  // Prefer Reddit's own OAuth API when credentials are configured -- it's
  // the reliable, made-for-this path. Falls through to Pullpush below (with
  // its own retry/stale-cache handling) if credentials aren't set yet, or
  // if the OAuth call itself fails for any reason.
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
