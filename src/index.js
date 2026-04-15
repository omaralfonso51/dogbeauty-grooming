const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const petRoutes = require('./routes/petRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'DogBeauty API funcionando ✅' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/pets', petRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

module.exports = app;