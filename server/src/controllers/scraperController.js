const { scrapeBBC, scrapeNDTV, fetchReddit } = require('../services/scraperService');
const cache = require('../services/cache');

async function getBBCNews(req, res) {
  try {
    const articles = await scrapeBBC();
    res.status(200).json(articles);
  } catch (err) {
    console.error('BBC scraping error:', err.message);
    res.status(500).json({ error: 'Failed to scrape BBC news' });
  }
}

async function getNDTVNews(req, res) {
  try {
    const articles = await scrapeNDTV();
    res.status(200).json(articles);
  } catch (err) {
    console.error('NDTV scraping error:', err.message);
    res.status(500).json({ error: 'Failed to scrape NDTV news' });
  }
}

async function getRedditNews(req, res) {
  try {
    const sub = req.query.sub || 'DisasterUpdate';
    const posts = await fetchReddit(sub);
    res.status(200).json(posts);
  } catch (err) {
    console.error('Reddit error:', err.message);
    if (err.upstreamUnavailable) {
      res.status(503).json({ error: err.message, upstreamUnavailable: true });
    } else {
      res.status(500).json({ error: 'Failed to fetch Reddit posts' });
    }
  }
}

async function getCacheStats(req, res) {
  const stats = cache.getStats();
  const keys = cache.keys();
  const cacheInfo = Object.fromEntries(
    keys.map((key) => [key, { ttl: cache.getTtl(key), expiresIn: Math.round(((cache.getTtl(key) || 0) - Date.now()) / 1000) }])
  );
  res.status(200).json({ stats, activeKeys: cacheInfo });
}

module.exports = { getBBCNews, getNDTVNews, getRedditNews, getCacheStats };
