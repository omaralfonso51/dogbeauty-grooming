const pool = require('../config/db');

// Listar mascotas con nombre del dueño
const getPets = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, o.name AS owner_name, o.phone AS owner_phone
      FROM pets p
      JOIN owners o ON p.owner_id = o.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mascotas' });
  }
};

// Obtener mascota por ID con historial de citas
const getPetById = async (req, res) => {
  const { id } = req.params;
  try {
    const pet = await pool.query(`
      SELECT p.*, o.name AS owner_name, o.phone AS owner_phone
      FROM pets p
      JOIN owners o ON p.owner_id = o.id
      WHERE p.id = $1
    `, [id]);

    if (pet.rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const history = await pool.query(`
      SELECT a.*, u.name AS groomer_name, c.name AS cut_name
      FROM appointments a
      LEFT JOIN users u ON a.groomer_id = u.id
      LEFT JOIN cuts c ON a.cut_id = c.id
      WHERE a.pet_id = $1
      ORDER BY a.date DESC
    `, [id]);

    res.json({ ...pet.rows[0], history: history.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mascota' });
  }
};

// Crear mascota
const createPet = async (req, res) => {
  const { name, breed, owner_id, notes, photo_url } = req.body;

  if (!name || !breed || !owner_id) {
    return res.status(400).json({ error: 'Nombre, raza y dueño son obligatorios' });
  }

  try {
    const ownerExists = await pool.query('SELECT id FROM owners WHERE id = $1', [owner_id]);
    if (ownerExists.rows.length === 0) {
      return res.status(404).json({ error: 'Dueño no encontrado' });
    }

    const result = await pool.query(
      'INSERT INTO pets (name, breed, owner_id, notes, photo_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, breed, owner_id, notes, photo_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear mascota' });
  }
};

// Actualizar mascota
const updatePet = async (req, res) => {
  const { id } = req.params;
  const { name, breed, notes, photo_url } = req.body;

  if (!name || !breed) {
    return res.status(400).json({ error: 'Nombre y raza son obligatorios' });
  }

  try {
    const result = await pool.query(
      'UPDATE pets SET name=$1, breed=$2, notes=$3, photo_url=$4 WHERE id=$5 RETURNING *',
      [name, breed, notes, photo_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar mascota' });
  }
};

// ✅ Eliminar mascota (CON FIX)
const deletePet = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM pets WHERE id=$1 RETURNING *', [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    res.json({ message: 'Mascota eliminada correctamente' });

  } catch (error) {

    // 🔥 AQUÍ ESTÁ EL FIX IMPORTANTE
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'No puedes eliminar esta mascota porque tiene citas asociadas. Primero elimina las citas.'
      });
    }

    res.status(500).json({ error: 'Error al eliminar mascota' });
  }
};

module.exports = { getPets, getPetById, createPet, updatePet, deletePet };