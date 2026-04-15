const pool = require('../config/db');

// Listar todos los dueños
const getOwners = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM owners ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener dueños' });
  }
};

// Obtener un dueño con sus mascotas
const getOwnerById = async (req, res) => {
  const { id } = req.params;
  try {
    const owner = await pool.query('SELECT * FROM owners WHERE id = $1', [id]);
    if (owner.rows.length === 0) {
      return res.status(404).json({ error: 'Dueño no encontrado' });
    }

    const pets = await pool.query('SELECT * FROM pets WHERE owner_id = $1', [id]);

    res.json({ ...owner.rows[0], pets: pets.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener dueño' });
  }
};

// Crear dueño
const createOwner = async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO owners (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
      [name, phone, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear dueño' });
  }
};

// Actualizar dueño
const updateOwner = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const result = await pool.query(
      'UPDATE owners SET name=$1, phone=$2, email=$3 WHERE id=$4 RETURNING *',
      [name, phone, email, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dueño no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar dueño' });
  }
};

// Eliminar dueño
const deleteOwner = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM owners WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dueño no encontrado' });
    }
    res.json({ message: 'Dueño eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar dueño' });
  }
};

module.exports = { getOwners, getOwnerById, createOwner, updateOwner, deleteOwner };