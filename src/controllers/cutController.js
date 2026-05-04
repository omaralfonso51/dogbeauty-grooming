const pool = require('../config/db');

// Listar cortes
const getCuts = async (req, res) => {
  try {
    const { breed } = req.query;
    let query = 'SELECT * FROM cuts WHERE deleted_at IS NULL ORDER BY breed ASC';
    let params = [];

    if (breed) {
      query = 'SELECT * FROM cuts WHERE deleted_at IS NULL AND LOWER(breed) LIKE $1 ORDER BY breed ASC';
      params = [`%${breed.toLowerCase()}%`];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cortes' });
  }
};

// Obtener corte por ID
const getCutById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM cuts WHERE id = $1 AND deleted_at IS NULL', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener corte' });
  }
};

// Crear corte
const createCut = async (req, res) => {
  const { name, breed, description, image_url, price } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cuts (name, breed, description, image_url, price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, breed, description, image_url, price || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear corte' });
  }
};

// Actualizar corte
const updateCut = async (req, res) => {
  const { id } = req.params;
  const { name, breed, description, image_url, price } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const result = await pool.query(
      `UPDATE cuts SET name=$1, breed=$2, description=$3, image_url=$4, price=$5
       WHERE id=$6 RETURNING *`,
      [name, breed, description, image_url, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar corte' });
  }
};

// Eliminar corte
const deleteCut = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cuts WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Corte no encontrado' });
    }
    res.json({ message: 'Corte eliminado correctamente' });
  } catch (error) {
    // Captura específica del error de foreign key de PostgreSQL
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'No puedes eliminar este corte porque tiene citas asociadas. Primero cancela o elimina las citas relacionadas.'
      });
    }
    res.status(500).json({ error: 'Error al eliminar corte' });
  }
};

module.exports = { getCuts, getCutById, createCut, updateCut, deleteCut };