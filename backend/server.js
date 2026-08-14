require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getPool } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');


const app = express();


app.use(cors());
app.use(express.json());
const dishRoutes = require('./src/routes/dishRoutes');
app.use('/api/dishes', dishRoutes);
const purchaseRoutes = require('./src/routes/purchaseRoutes');
app.use('/api/purchases', purchaseRoutes);
const basketRoutes = require('./src/routes/basketRoutes');
app.use('/api/basket', basketRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
  const outletRoutes = require('./src/routes/outletRoutes');
app.use('/api/outlets', outletRoutes);
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

getPool()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MS SQL Server:', err.message);
    process.exit(1);
  });
