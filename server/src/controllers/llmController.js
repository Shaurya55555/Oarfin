const { isDisasterNews } = require('../services/llmService');

async function checkDisasterNews(req, res) {
  const { title, news } = req.body;
  if (!title || !news) {
    return res.status(400).json({ error: 'title and news are required' });
  }

  try {
    const answer = await isDisasterNews({ title, content: news });
    res.status(200).json({ answer });
  } catch (err) {
    console.error('LLM error:', err.message);
    res.status(500).json({ error: 'LLM processing error' });
  }
}

module.exports = { checkDisasterNews };
