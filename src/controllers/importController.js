const pool = require('../config/db');
const { parse } = require('csv-parse/sync');
const bcrypt = require('bcryptjs');

// ============================================
// IMPORTAR DUEÑOS
// ============================================
const importOwners = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  try {
    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'El archivo CSV está vacío' });
    }

    // Validar columnas requeridas
    const required = ['name'];
    const headers = Object.keys(records[0]);
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Columnas faltantes: ${missing.join(', ')}. Requeridas: name. Opcionales: phone, email`
      });
    }

    const results = { success: 0, errors: [], skipped: 0 };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.name?.trim()) {
        results.errors.push(`Fila ${rowNum}: El nombre es obligatorio`);
        continue;
      }

      // Verificar si ya existe por email
      if (row.email?.trim()) {
        const exists = await pool.query(
          'SELECT id FROM owners WHERE email=$1', [row.email.trim()]
        );
        if (exists.rows.length > 0) {
          results.skipped++;
          results.errors.push(`Fila ${rowNum}: El email ${row.email} ya existe (omitido)`);
          continue;
        }
      }

      try {
        await pool.query(
          'INSERT INTO owners (name, phone, email) VALUES ($1, $2, $3)',
          [row.name.trim(), row.phone?.trim() || null, row.email?.trim() || null]
        );
        results.success++;
      } catch (err) {
        results.errors.push(`Fila ${rowNum}: Error al insertar - ${err.message}`);
      }
    }

    res.json({
      message: `Importación completada: ${results.success} dueños importados, ${results.skipped} omitidos`,
      ...results
    });
  } catch (err) {
    res.status(400).json({ error: `Error al procesar CSV: ${err.message}` });
  }
};

// ============================================
// IMPORTAR MASCOTAS
// ============================================
const importPets = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  try {
    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'El archivo CSV está vacío' });
    }

    const required = ['name', 'breed'];
    const headers = Object.keys(records[0]);
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Columnas faltantes: ${missing.join(', ')}. Requeridas: name, breed. Opcionales: owner_email, owner_name, notes, photo_url`
      });
    }

    // Verificar que haya dueños en el sistema
    const ownersCount = await pool.query('SELECT COUNT(*) FROM owners');
    if (parseInt(ownersCount.rows[0].count) === 0) {
      return res.status(400).json({
        error: '⚠️ No hay dueños registrados. Primero importa o crea los dueños antes de importar mascotas.'
      });
    }

    const results = { success: 0, errors: [], skipped: 0 };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.name?.trim()) {
        results.errors.push(`Fila ${rowNum}: El nombre de la mascota es obligatorio`);
        continue;
      }
      if (!row.breed?.trim()) {
        results.errors.push(`Fila ${rowNum}: La raza es obligatoria`);
        continue;
      }

      // Buscar dueño por email o nombre
      let ownerId = null;

      if (row.owner_email?.trim()) {
        const owner = await pool.query(
          'SELECT id FROM owners WHERE email=$1', [row.owner_email.trim()]
        );
        if (owner.rows.length > 0) ownerId = owner.rows[0].id;
        else {
          results.errors.push(`Fila ${rowNum}: No se encontró dueño con email "${row.owner_email}" (mascota omitida)`);
          results.skipped++;
          continue;
        }
      } else if (row.owner_name?.trim()) {
        const owner = await pool.query(
          'SELECT id FROM owners WHERE LOWER(name)=LOWER($1) LIMIT 1', [row.owner_name.trim()]
        );
        if (owner.rows.length > 0) ownerId = owner.rows[0].id;
        else {
          results.errors.push(`Fila ${rowNum}: No se encontró dueño con nombre "${row.owner_name}" (mascota omitida)`);
          results.skipped++;
          continue;
        }
      } else {
        results.errors.push(`Fila ${rowNum}: Debes especificar owner_email u owner_name`);
        results.skipped++;
        continue;
      }

      try {
        await pool.query(
          'INSERT INTO pets (name, breed, owner_id, notes, photo_url) VALUES ($1, $2, $3, $4, $5)',
          [row.name.trim(), row.breed.trim(), ownerId, row.notes?.trim() || null, row.photo_url?.trim() || null]
        );
        results.success++;
      } catch (err) {
        results.errors.push(`Fila ${rowNum}: Error al insertar - ${err.message}`);
      }
    }

    res.json({
      message: `Importación completada: ${results.success} mascotas importadas, ${results.skipped} omitidas`,
      ...results
    });
  } catch (err) {
    res.status(400).json({ error: `Error al procesar CSV: ${err.message}` });
  }
};

// ============================================
// IMPORTAR CORTES
// ============================================
const importCuts = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  try {
    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'El archivo CSV está vacío' });
    }

    const required = ['name'];
    const headers = Object.keys(records[0]);
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Columnas faltantes: ${missing.join(', ')}. Requeridas: name. Opcionales: breed, description, price, image_url`
      });
    }

    const results = { success: 0, errors: [], skipped: 0 };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.name?.trim()) {
        results.errors.push(`Fila ${rowNum}: El nombre del corte es obligatorio`);
        continue;
      }

      // Validar precio si viene
      let price = 0;
      if (row.price?.trim()) {
        price = parseFloat(row.price.replace(/[^0-9.]/g, ''));
        if (isNaN(price) || price < 0) {
          results.errors.push(`Fila ${rowNum}: El precio "${row.price}" no es válido, se usará 0`);
          price = 0;
        }
      }

      // Verificar duplicado por nombre y raza
      const exists = await pool.query(
        'SELECT id FROM cuts WHERE LOWER(name)=LOWER($1) AND LOWER(COALESCE(breed,\'\'))=LOWER($2)',
        [row.name.trim(), row.breed?.trim() || '']
      );
      if (exists.rows.length > 0) {
        results.skipped++;
        results.errors.push(`Fila ${rowNum}: El corte "${row.name}" para raza "${row.breed || 'general'}" ya existe (omitido)`);
        continue;
      }

      try {
        await pool.query(
          'INSERT INTO cuts (name, breed, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
          [row.name.trim(), row.breed?.trim() || null, row.description?.trim() || null, price, row.image_url?.trim() || null]
        );
        results.success++;
      } catch (err) {
        results.errors.push(`Fila ${rowNum}: Error al insertar - ${err.message}`);
      }
    }

    res.json({
      message: `Importación completada: ${results.success} cortes importados, ${results.skipped} omitidos`,
      ...results
    });
  } catch (err) {
    res.status(400).json({ error: `Error al procesar CSV: ${err.message}` });
  }
};

// ============================================
// IMPORTAR PRODUCTOS
// ============================================
const importProducts = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  try {
    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'El archivo CSV está vacío' });
    }

    const required = ['name', 'price'];
    const headers = Object.keys(records[0]);
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Columnas faltantes: ${missing.join(', ')}. Requeridas: name, price. Opcionales: category, stock, description, image_url`
      });
    }

    // Obtener categorías válidas
    const catsResult = await pool.query('SELECT name FROM categories');
    const validCategories = catsResult.rows.map(c => c.name.toLowerCase());

    const results = { success: 0, errors: [], skipped: 0 };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.name?.trim()) {
        results.errors.push(`Fila ${rowNum}: El nombre del producto es obligatorio`);
        continue;
      }

      // Validar precio
      const price = parseFloat(row.price?.replace(/[^0-9.]/g, ''));
      if (!row.price?.trim() || isNaN(price) || price <= 0) {
        results.errors.push(`Fila ${rowNum}: El precio "${row.price}" no es válido`);
        continue;
      }

      // Validar stock
      let stock = 0;
      if (row.stock?.trim()) {
        stock = parseInt(row.stock);
        if (isNaN(stock) || stock < 0) {
          results.errors.push(`Fila ${rowNum}: El stock "${row.stock}" no es válido, se usará 0`);
          stock = 0;
        }
      }

      // Validar categoría
      let category = 'otro';
      if (row.category?.trim()) {
        if (validCategories.includes(row.category.trim().toLowerCase())) {
          category = row.category.trim().toLowerCase();
        } else {
          results.errors.push(`Fila ${rowNum}: Categoría "${row.category}" no existe, se usará "otro"`);
          category = 'otro';
        }
      }

      // Verificar duplicado por nombre
      const exists = await pool.query(
        'SELECT id FROM products WHERE LOWER(name)=LOWER($1)', [row.name.trim()]
      );
      if (exists.rows.length > 0) {
        results.skipped++;
        results.errors.push(`Fila ${rowNum}: El producto "${row.name}" ya existe (omitido)`);
        continue;
      }

      try {
        await pool.query(
          'INSERT INTO products (name, category, price, stock, description, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
          [row.name.trim(), category, price, stock, row.description?.trim() || null, row.image_url?.trim() || null]
        );
        results.success++;
      } catch (err) {
        results.errors.push(`Fila ${rowNum}: Error al insertar - ${err.message}`);
      }
    }

    res.json({
      message: `Importación completada: ${results.success} productos importados, ${results.skipped} omitidos`,
      ...results
    });
  } catch (err) {
    res.status(400).json({ error: `Error al procesar CSV: ${err.message}` });
  }
};

module.exports = { importOwners, importPets, importCuts, importProducts };