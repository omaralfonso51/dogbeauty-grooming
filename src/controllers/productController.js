const pool = require('../config/db');

// Listar productos
const getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Crear producto
const createProduct = async (req, res) => {
  const { name, category, price, stock, description, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
  }

  try {
    const result = await pool.query(
    `INSERT INTO products (name, category, price, stock, description, image_url)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, category || 'otro', price, stock || 0, description, image_url]
  );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock, description, image_url } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
  }

  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, category=$2, price=$3, stock=$4, description=$5, image_url=$6
      WHERE id=$7 RETURNING *`,
      [name, category, price, stock, description, image_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Eliminar producto
  const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        'DELETE FROM products WHERE id=$1 RETURNING *', [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({
          error: 'No puedes eliminar este producto porque tiene ventas asociadas.'
        });
      }
      res.status(500).json({ error: 'Error al eliminar producto' });
    }
  };

// Vender producto (descuenta stock)
const sellProduct = async (req, res) => {
  const { product_id, quantity, owner_id } = req.body;

  if (!product_id || !quantity) {
    return res.status(400).json({ error: 'Producto y cantidad son obligatorios' });
  }

  try {
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (product.rows[0].stock < quantity) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Obtener commission_rate del groomer
    const groomer = await pool.query(
      'SELECT commission_rate FROM users WHERE id = $1', [req.user.id]
    );

    const total = product.rows[0].price * quantity;
    const commission_amount = (total * groomer.rows[0].commission_rate) / 100;

    // Registrar venta con comisión
    const sale = await pool.query(
      `INSERT INTO sales (product_id, owner_id, groomer_id, quantity, total, commission_amount)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [product_id, owner_id, req.user.id, quantity, total, commission_amount]
    );

    // Descontar stock
    await pool.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2',
      [quantity, product_id]
    );

    res.status(201).json({
      message: 'Venta registrada',
      sale: sale.rows[0],
      total,
      commission_amount
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar venta' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  sellProduct
};