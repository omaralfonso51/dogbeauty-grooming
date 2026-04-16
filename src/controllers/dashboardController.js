const pool = require('../config/db');

const getDashboard = async (req, res) => {
  try {
    // Total ingresos por servicios
    const serviceIncome = await pool.query(`
      SELECT COALESCE(SUM(price), 0) AS total
      FROM appointments
      WHERE status = 'completed'
    `);

    // Total ingresos por productos
    const productIncome = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM sales
    `);

    // Groomer con más ingresos
    const topGroomer = await pool.query(`
      SELECT u.name, COALESCE(SUM(a.price), 0) AS total_income
      FROM appointments a
      JOIN users u ON a.groomer_id = u.id
      WHERE a.status = 'completed'
      GROUP BY u.name
      ORDER BY total_income DESC
      LIMIT 1
    `);

    // Servicio más solicitado
    const topService = await pool.query(`
      SELECT service_type, COUNT(*) AS total
      FROM appointments
      GROUP BY service_type
      ORDER BY total DESC
      LIMIT 1
    `);

    // Citas por estado
    const appointmentsByStatus = await pool.query(`
      SELECT status, COUNT(*) AS total
      FROM appointments
      GROUP BY status
    `);

    // Comisiones por groomer
    const commissionsByGroomer = await pool.query(`
      SELECT u.name, COALESCE(SUM(c.amount), 0) AS total_commissions
      FROM commissions c
      JOIN users u ON c.groomer_id = u.id
      GROUP BY u.name
      ORDER BY total_commissions DESC
    `);

    // Productos con bajo stock
    const lowStock = await pool.query(`
      SELECT name, stock FROM products
      WHERE stock < 10
      ORDER BY stock ASC
    `);

    res.json({
      income: {
        services: parseFloat(serviceIncome.rows[0].total),
        products: parseFloat(productIncome.rows[0].total),
        total: parseFloat(serviceIncome.rows[0].total) + parseFloat(productIncome.rows[0].total)
      },
      top_groomer: topGroomer.rows[0] || null,
      top_service: topService.rows[0] || null,
      appointments_by_status: appointmentsByStatus.rows,
      commissions_by_groomer: commissionsByGroomer.rows,
      low_stock_products: lowStock.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener métricas del dashboard' });
  }
};

module.exports = { getDashboard };