const pool = require('../config/db');

const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const exists = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'La categoría ya existe' });
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const result = await pool.query(
      'UPDATE categories SET name=$1 WHERE id=$2 RETURNING *', [name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Primero obtener el nombre de la categoría
    const cat = await pool.query('SELECT name FROM categories WHERE id=$1', [id]);
    if (cat.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar si hay productos con esta categoría
    const products = await pool.query(
      'SELECT COUNT(*) FROM products WHERE category=$1', [cat.rows[0].name]
    );

    if (parseInt(products.rows[0].count) > 0) {
      return res.status(400).json({
        error: `No puedes eliminar esta categoría porque tiene ${products.rows[0].count} producto(s) asociado(s). Cambia la categoría de esos productos primero.`
      });
    }

    await pool.query('DELETE FROM categories WHERE id=$1', [id]);
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };