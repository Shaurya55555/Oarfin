const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const locationRoutes = require('./routes/location.routes');
const disasterRoutes = require('./routes/disaster.routes');
const safeLocationRoutes = require('./routes/safelocation.routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (_, res) => {
  res.send('Disaster Alert Backend Running');
});

app.use('/api/location', locationRoutes);
app.use('/', disasterRoutes);
app.use('/', safeLocationRoutes);

module.exports = app;
