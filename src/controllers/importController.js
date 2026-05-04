const pool = require('../config/db');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');

// =============================================
// UTILIDADES
// =============================================

const generateBatchId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `BATCH-${date}-${uuidv4().slice(0, 8).toUpperCase()}`;
};

const logAudit = async (client, { userId, action, entityType, entityId, oldData, newData, batchId, ip }) => {
  try {
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, import_batch_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, action, entityType, entityId, oldData ? JSON.stringify(oldData) : null,
       newData ? JSON.stringify(newData) : null, batchId || null, ip || null]
    );
  } catch (e) {
    console.error('Error en audit log:', e.message);
  }
};

const parseCsv = (buffer) => {
  const content = buffer.toString('utf-8').replace(/^\uFEFF/, ''); // quitar BOM
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    skip_records_with_empty_values: false
  });
};

const validateRequiredHeaders = (records, required) => {
  if (records.length === 0) throw new Error('El archivo CSV está vacío');
  const headers = Object.keys(records[0]);
  const missing = required.filter(r => !headers.map(h => h.toLowerCase()).includes(r.toLowerCase()));
  if (missing.length > 0) {
    throw new Error(`Columnas faltantes: ${missing.join(', ')}`);
  }
};

// =============================================
// IMPORTAR DUEÑOS
// =============================================
const importOwners = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  const client = await pool.connect();
  const batchId = generateBatchId();
  const userId = req.user.id;
  const ip = req.ip;

  try {
    const records = parseCsv(req.file.buffer);
    validateRequiredHeaders(records, ['name']);

    const results = {
      batchId,
      success: 0,
      skipped: 0,
      errors: [],
      insertedIds: []
    };

    await client.query('BEGIN');

    // Registrar lote
    await client.query(
      `INSERT INTO import_batches (id, entity_type, total_rows, created_by)
       VALUES ($1, 'owners', $2, $3)`,
      [batchId, records.length, userId]
    );

    // Bulk insert con ON CONFLICT DO NOTHING
    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowNum = i + j + 2;

        if (!row.name?.trim()) {
          results.errors.push(`Fila ${rowNum}: Nombre obligatorio`);
          continue;
        }

        if (row.email?.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email.trim())) {
            results.errors.push(`Fila ${rowNum}: Email "${row.email}" inválido (omitido)`);
            results.skipped++;
            continue;
          }
        }

        const result = await client.query(
          `INSERT INTO owners (name, phone, email, import_batch_id, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [row.name.trim(), row.phone?.trim() || null, row.email?.trim() || null, batchId]
        );

        if (result.rows.length > 0) {
          results.success++;
          results.insertedIds.push(result.rows[0].id);
          await logAudit(client, {
            userId, action: 'IMPORT_CREATE', entityType: 'owners',
            entityId: result.rows[0].id,
            newData: { name: row.name, phone: row.phone, email: row.email },
            batchId, ip
          });
        } else {
          results.skipped++;
          results.errors.push(`Fila ${rowNum}: "${row.name}" omitido (email duplicado o conflicto)`);
        }
      }
    }

    // Actualizar lote
    await client.query(
      `UPDATE import_batches 
       SET success_rows=$1, skipped_rows=$2, error_rows=$3, status='completed'
       WHERE id=$4`,
      [results.success, results.skipped, results.errors.length, batchId]
    );

    await client.query('COMMIT');

    res.json({
      message: `✅ ${results.success} dueños importados, ${results.skipped} omitidos`,
      batchId,
      success: results.success,
      skipped: results.skipped,
      errors: results.errors,
      canUndo: results.success > 0
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// =============================================
// IMPORTAR MASCOTAS
// =============================================
const importPets = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  const client = await pool.connect();
  const batchId = generateBatchId();
  const userId = req.user.id;
  const ip = req.ip;

  try {
    const records = parseCsv(req.file.buffer);
    validateRequiredHeaders(records, ['name', 'breed']);

    // Verificar que haya dueños
    const ownersCount = await client.query("SELECT COUNT(*) FROM owners WHERE deleted_at IS NULL");
    if (parseInt(ownersCount.rows[0].count) === 0) {
      return res.status(400).json({
        error: '⚠️ No hay dueños registrados. Importa los dueños primero.'
      });
    }

    // Precargar dueños en memoria para evitar N+1 queries
    const ownersResult = await client.query(
      "SELECT id, LOWER(name) as name, email FROM owners WHERE deleted_at IS NULL"
    );
    const ownersByEmail = {};
    const ownersByName = {};
    ownersResult.rows.forEach(o => {
      if (o.email) ownersByEmail[o.email.toLowerCase()] = o.id;
      ownersByName[o.name] = o.id;
    });

    const results = { batchId, success: 0, skipped: 0, errors: [], insertedIds: [] };

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO import_batches (id, entity_type, total_rows, created_by)
       VALUES ($1, 'pets', $2, $3)`,
      [batchId, records.length, userId]
    );

    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowNum = i + j + 2;

        if (!row.name?.trim()) {
          results.errors.push(`Fila ${rowNum}: Nombre de mascota obligatorio`);
          continue;
        }
        if (!row.breed?.trim()) {
          results.errors.push(`Fila ${rowNum}: Raza obligatoria`);
          continue;
        }

        let ownerId = null;

        if (row.owner_email?.trim()) {
          ownerId = ownersByEmail[row.owner_email.trim().toLowerCase()];
          if (!ownerId) {
            results.errors.push(`Fila ${rowNum}: No se encontró dueño con email "${row.owner_email}"`);
            results.skipped++;
            continue;
          }
        } else if (row.owner_name?.trim()) {
          ownerId = ownersByName[row.owner_name.trim().toLowerCase()];
          if (!ownerId) {
            results.errors.push(`Fila ${rowNum}: No se encontró dueño con nombre "${row.owner_name}"`);
            results.skipped++;
            continue;
          }
        } else {
          results.errors.push(`Fila ${rowNum}: Debes incluir owner_email u owner_name`);
          results.skipped++;
          continue;
        }

        const result = await client.query(
          `INSERT INTO pets (name, breed, owner_id, notes, photo_url, import_batch_id, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING id`,
          [row.name.trim(), row.breed.trim(), ownerId,
           row.notes?.trim() || null, row.photo_url?.trim() || null, batchId]
        );

        results.success++;
        results.insertedIds.push(result.rows[0].id);
        await logAudit(client, {
          userId, action: 'IMPORT_CREATE', entityType: 'pets',
          entityId: result.rows[0].id,
          newData: { name: row.name, breed: row.breed, owner_id: ownerId },
          batchId, ip
        });
      }
    }

    await client.query(
      `UPDATE import_batches 
       SET success_rows=$1, skipped_rows=$2, error_rows=$3, status='completed'
       WHERE id=$4`,
      [results.success, results.skipped, results.errors.length, batchId]
    );

    await client.query('COMMIT');

    res.json({
      message: `✅ ${results.success} mascotas importadas, ${results.skipped} omitidas`,
      batchId,
      success: results.success,
      skipped: results.skipped,
      errors: results.errors,
      canUndo: results.success > 0
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// =============================================
// IMPORTAR PRODUCTOS
// =============================================
const importProducts = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  const client = await pool.connect();
  const batchId = generateBatchId();
  const userId = req.user.id;
  const ip = req.ip;

  try {
    const records = parseCsv(req.file.buffer);
    validateRequiredHeaders(records, ['name', 'price']);

    // Precargar categorías
    const catsResult = await client.query('SELECT name FROM categories');
    const validCats = new Set(catsResult.rows.map(c => c.name.toLowerCase()));

    const results = { batchId, success: 0, skipped: 0, errors: [], insertedIds: [] };

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO import_batches (id, entity_type, total_rows, created_by)
       VALUES ($1, 'products', $2, $3)`,
      [batchId, records.length, userId]
    );

    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowNum = i + j + 2;

        if (!row.name?.trim()) {
          results.errors.push(`Fila ${rowNum}: Nombre obligatorio`);
          continue;
        }

        const price = parseFloat(String(row.price).replace(/[^0-9.]/g, ''));
        if (isNaN(price) || price <= 0) {
          results.errors.push(`Fila ${rowNum}: Precio "${row.price}" inválido`);
          continue;
        }

        let stock = parseInt(row.stock) || 0;
        if (stock < 0) {
          results.errors.push(`Fila ${rowNum}: Stock negativo, se usará 0`);
          stock = 0;
        }

        let category = 'otro';
        if (row.category?.trim()) {
          const cat = row.category.trim().toLowerCase();
          if (validCats.has(cat)) {
            category = cat;
          } else {
            results.errors.push(`Fila ${rowNum}: Categoría "${row.category}" no existe, se usará "otro"`);
          }
        }

        const result = await client.query(
          `INSERT INTO products (name, category, price, stock, description, image_url, import_batch_id, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [row.name.trim(), category, price, stock,
           row.description?.trim() || null, row.image_url?.trim() || null, batchId]
        );

        if (result.rows.length > 0) {
          results.success++;
          results.insertedIds.push(result.rows[0].id);
          await logAudit(client, {
            userId, action: 'IMPORT_CREATE', entityType: 'products',
            entityId: result.rows[0].id,
            newData: { name: row.name, price, category, stock },
            batchId, ip
          });
        } else {
          results.skipped++;
          results.errors.push(`Fila ${rowNum}: "${row.name}" ya existe (omitido)`);
        }
      }
    }

    await client.query(
      `UPDATE import_batches 
       SET success_rows=$1, skipped_rows=$2, error_rows=$3, status='completed'
       WHERE id=$4`,
      [results.success, results.skipped, results.errors.length, batchId]
    );

    await client.query('COMMIT');

    res.json({
      message: `✅ ${results.success} productos importados, ${results.skipped} omitidos`,
      batchId,
      success: results.success,
      skipped: results.skipped,
      errors: results.errors,
      canUndo: results.success > 0
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// =============================================
// IMPORTAR CORTES
// =============================================
const importCuts = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  const client = await pool.connect();
  const batchId = generateBatchId();
  const userId = req.user.id;
  const ip = req.ip;

  try {
    const records = parseCsv(req.file.buffer);
    validateRequiredHeaders(records, ['name']);

    const results = { batchId, success: 0, skipped: 0, errors: [], insertedIds: [] };

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO import_batches (id, entity_type, total_rows, created_by)
       VALUES ($1, 'cuts', $2, $3)`,
      [batchId, records.length, userId]
    );

    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowNum = i + j + 2;

        if (!row.name?.trim()) {
          results.errors.push(`Fila ${rowNum}: Nombre obligatorio`);
          continue;
        }

        let price = 0;
        if (row.price?.trim()) {
          price = parseFloat(String(row.price).replace(/[^0-9.]/g, ''));
          if (isNaN(price) || price < 0) price = 0;
        }

        const result = await client.query(
          `INSERT INTO cuts (name, breed, description, price, image_url, import_batch_id, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [row.name.trim(), row.breed?.trim() || null,
           row.description?.trim() || null, price,
           row.image_url?.trim() || null, batchId]
        );

        if (result.rows.length > 0) {
          results.success++;
          results.insertedIds.push(result.rows[0].id);
          await logAudit(client, {
            userId, action: 'IMPORT_CREATE', entityType: 'cuts',
            entityId: result.rows[0].id,
            newData: { name: row.name, breed: row.breed, price },
            batchId, ip
          });
        } else {
          results.skipped++;
          results.errors.push(`Fila ${rowNum}: "${row.name}" ya existe (omitido)`);
        }
      }
    }

    await client.query(
      `UPDATE import_batches 
       SET success_rows=$1, skipped_rows=$2, error_rows=$3, status='completed'
       WHERE id=$4`,
      [results.success, results.skipped, results.errors.length, batchId]
    );

    await client.query('COMMIT');

    res.json({
      message: `✅ ${results.success} cortes importados, ${results.skipped} omitidos`,
      batchId,
      success: results.success,
      skipped: results.skipped,
      errors: results.errors,
      canUndo: results.success > 0
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// =============================================
// DESHACER IMPORTACIÓN (SOFT DELETE)
// =============================================
const undoImport = async (req, res) => {
  const { batchId } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const batch = await client.query(
      'SELECT * FROM import_batches WHERE id=$1', [batchId]
    );

    if (batch.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lote de importación no encontrado' });
    }

    if (batch.rows[0].undone) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Este lote ya fue deshecho anteriormente' });
    }

    const entityType = batch.rows[0].entity_type;
    let undoneCount = 0;

    if (entityType === 'owners') {
      const ownerIds = await client.query(
        `SELECT id FROM owners WHERE import_batch_id=$1 AND deleted_at IS NULL`,
        [batchId]
      );
      for (const row of ownerIds.rows) {
        await client.query(
          `UPDATE pets SET deleted_at=NOW(), updated_at=NOW()
           WHERE owner_id=$1 AND deleted_at IS NULL`,
          [row.id]
        );
      }
      const result = await client.query(
        `UPDATE owners SET deleted_at=NOW(), updated_at=NOW()
         WHERE import_batch_id=$1 AND deleted_at IS NULL
         RETURNING id`,
        [batchId]
      );
      undoneCount = result.rowCount;

    } else if (entityType === 'pets') {
      const result = await client.query(
        `UPDATE pets SET deleted_at=NOW(), updated_at=NOW()
         WHERE import_batch_id=$1 AND deleted_at IS NULL
         RETURNING id`,
        [batchId]
      );
      undoneCount = result.rowCount;

    } else if (entityType === 'products') {
      const result = await client.query(
        `UPDATE products SET deleted_at=NOW(), updated_at=NOW()
         WHERE import_batch_id=$1 AND deleted_at IS NULL
         RETURNING id`,
        [batchId]
      );
      undoneCount = result.rowCount;

    } else if (entityType === 'cuts') {
      const withAppts = await client.query(
        `SELECT COUNT(*) FROM cuts c
         JOIN appointments a ON a.cut_id = c.id
         WHERE c.import_batch_id=$1
         AND c.deleted_at IS NULL
         AND a.status != 'cancelled'`,
        [batchId]
      );

      if (parseInt(withAppts.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `No se puede deshacer: ${withAppts.rows[0].count} corte(s) tienen citas activas`
        });
      }

      const result = await client.query(
        `UPDATE cuts SET deleted_at=NOW(), updated_at=NOW()
         WHERE import_batch_id=$1 AND deleted_at IS NULL
         RETURNING id`,
        [batchId]
      );
      undoneCount = result.rowCount;
    }

    await client.query(
      `UPDATE import_batches SET undone=TRUE, undone_at=NOW() WHERE id=$1`,
      [batchId]
    );

    await logAudit(client, {
      userId, action: 'UNDO_IMPORT', entityType,
      entityId: null,
      newData: { batchId, undoneCount },
      batchId, ip
    });

    await client.query('COMMIT');

    res.json({
      message: `✅ Importación deshecha: ${undoneCount} registros eliminados (recuperables)`,
      undoneCount,
      batchId
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error undoImport:', err);
    res.status(500).json({ error: `Error al deshacer: ${err.message}` });
  } finally {
    client.release();
  }
};

// =============================================
// RECUPERAR REGISTROS ELIMINADOS POR LOTE
// =============================================
const recoverImport = async (req, res) => {
  const { batchId } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const batch = await client.query(
      'SELECT * FROM import_batches WHERE id=$1', [batchId]
    );

    if (batch.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (!batch.rows[0].undone) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Este lote no ha sido deshecho, no hay nada que recuperar' });
    }

    const entityType = batch.rows[0].entity_type;
    const tableMap = { owners: 'owners', pets: 'pets', products: 'products', cuts: 'cuts' };
    const table = tableMap[entityType];
    let recoveredCount = 0;

    if (table) {
      const result = await client.query(
        `UPDATE ${table}
         SET deleted_at=NULL, updated_at=NOW()
         WHERE import_batch_id=$1
         RETURNING id`,
        [batchId]
      );
      recoveredCount = result.rowCount;

      if (entityType === 'owners') {
        const ownerIds = await client.query(
          `SELECT id FROM owners WHERE import_batch_id=$1`, [batchId]
        );
        for (const row of ownerIds.rows) {
          await client.query(
            `UPDATE pets SET deleted_at=NULL, updated_at=NOW()
             WHERE owner_id=$1 AND import_batch_id IS NOT NULL`,
            [row.id]
          );
        }
      }
    }

    await client.query(
      `UPDATE import_batches SET undone=FALSE, undone_at=NULL WHERE id=$1`,
      [batchId]
    );

    await logAudit(client, {
      userId, action: 'RECOVER_IMPORT', entityType,
      entityId: null,
      newData: { batchId, recoveredCount },
      batchId, ip
    });

    await client.query('COMMIT');

    res.json({
      message: `✅ ${recoveredCount} registros recuperados exitosamente`,
      recoveredCount,
      batchId
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error recoverImport:', err);
    res.status(500).json({ error: `Error al recuperar: ${err.message}` });
  } finally {
    client.release();
  }
};

// =============================================
// LISTAR LOTES DE IMPORTACIÓN
// =============================================
const getBatches = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.name as created_by_name
       FROM import_batches b
       LEFT JOIN users u ON b.created_by = u.id
       ORDER BY b.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// =============================================
// LOGS DE AUDITORÍA
// =============================================
const getAuditLogs = async (req, res) => {
  const { entity_type, limit = 100 } = req.query;
  try {
    let query = `
      SELECT a.*, u.name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const params = [];
    if (entity_type) {
      query += ' WHERE a.entity_type=$1';
      params.push(entity_type);
    }
    query += ` ORDER BY a.created_at DESC LIMIT ${parseInt(limit)}`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

module.exports = {
  importOwners, importPets, importProducts, importCuts,
  undoImport, recoverImport, getBatches, getAuditLogs
};