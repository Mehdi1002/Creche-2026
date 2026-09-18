import { Router } from 'express';
import { getPool, sql } from '../db.js';

const router = Router();

// GET /api/children
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM children ORDER BY nom ASC');

    const children = result.recordset.map(row => ({
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      dateNaissance: row.date_naissance,
      dateInscription: row.date_inscription,
      sexe: row.sexe,
      section: row.section,
      nomPere: row.nom_pere,
      nomMere: row.nom_mere,
      numPere: row.num_pere,
      numMere: row.num_mere
    }));

    res.json(children);
  } catch (err) {
    console.error('GET /api/children erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/children (upsert)
router.post('/', async (req, res) => {
  try {
    const c = req.body;
    const pool = await getPool();

    await pool.request()
      .input('id', sql.NVarChar, c.id)
      .input('nom', sql.NVarChar, c.nom)
      .input('prenom', sql.NVarChar, c.prenom)
      .input('date_naissance', sql.NVarChar, c.dateNaissance)
      .input('date_inscription', sql.NVarChar, c.dateInscription)
      .input('sexe', sql.NVarChar, c.sexe)
      .input('section', sql.NVarChar, c.section)
      .input('nom_pere', sql.NVarChar, c.nomPere || '')
      .input('nom_mere', sql.NVarChar, c.nomMere || '')
      .input('num_pere', sql.NVarChar, c.numPere || '')
      .input('num_mere', sql.NVarChar, c.numMere || '')
      .query(`
        MERGE children AS target
        USING (SELECT @id AS id) AS source ON target.id = source.id
        WHEN MATCHED THEN
          UPDATE SET nom=@nom, prenom=@prenom, date_naissance=@date_naissance,
                     date_inscription=@date_inscription, sexe=@sexe, section=@section,
                     nom_pere=@nom_pere, nom_mere=@nom_mere, num_pere=@num_pere, num_mere=@num_mere
        WHEN NOT MATCHED THEN
          INSERT (id, nom, prenom, date_naissance, date_inscription, sexe, section, nom_pere, nom_mere, num_pere, num_mere)
          VALUES (@id, @nom, @prenom, @date_naissance, @date_inscription, @sexe, @section, @nom_pere, @nom_mere, @num_pere, @num_mere);
      `);

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/children erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/children/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('DELETE FROM children WHERE id = @id');

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/children erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
