require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const llmRoutes = require('./src/routes/llm');
const scraperRoutes = require('./src/routes/scraper');
const disasterRoutes = require('./src/routes/disasters');
const userRoutes = require('./src/routes/users');
const shelterRoutes = require('./src/routes/shelters');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => res.json({ status: 'Server is running', port: PORT }));

app.use('/api/users', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/news', scraperRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/shelters', shelterRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
