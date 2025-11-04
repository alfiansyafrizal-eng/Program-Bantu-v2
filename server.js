#!/usr/bin/env node
/**
 * ✅ SERVER UTAMA - versi lengkap aman untuk pkg (.exe)
 * - Tidak auto-close
 * - Tetap mendukung semua route: connect, query, update, tables, columns, tutorial
 */
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { randomUUID } = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===========================
// 🧩 Safe baseDir untuk .exe
// ===========================
const isPackaged = !!process.pkg;

// Gunakan folder tempat .exe dijalankan (bukan snapshot bawaan pkg)
const baseDir = isPackaged ? process.cwd() : __dirname;

// Folder tutorials (bisa ditulis)
const tutorialsDir = path.join(baseDir, "tutorials");
try {
  if (!fs.existsSync(tutorialsDir)) {
    fs.mkdirSync(tutorialsDir, { recursive: true });
    console.log("📁 Folder tutorials dibuat di:", tutorialsDir);
  }
} catch (err) {
  console.error("❌ Gagal membuat folder tutorials:", err.message);
}


// ===========================
// 🌐 API Base
// ===========================
const API_BASE = process.env.API_BASE || "http://localhost";

// ===========================
// 🧱 File statis (dashboard UI)
// ===========================
app.use(express.static(baseDir));
app.get("/", (req, res) => {
  res.sendFile(path.join(baseDir, "dashbord.html"));
});

// ===========================
// 💾 Database Connection
// ===========================
let pool = null;
app.post("/connect", async (req, res) => {
  const { server, port, user, password, database } = req.body;
  const config = {
    user,
    password,
    server,
    database,
    port: parseInt(port || 1433),
    options: { encrypt: false, trustServerCertificate: true },
  };

  try {
    const testPool = new sql.ConnectionPool(config);
    await testPool.connect();
    await testPool.request().query("SELECT 1 AS test");

    if (pool) await pool.close();
    pool = testPool;
    res.json({ success: true, message: "Koneksi berhasil" });
  } catch (err) {
    res.json({ success: false, error: "Gagal konek: " + err.message });
  }
});

app.post("/query", async (req, res) => {
  if (!pool) return res.json({ success: false, error: "Belum terkoneksi." });
  try {
    const { sqlQuery } = req.body;
    const result = await pool.request().query(sqlQuery);
    res.json({ success: true, rows: result.recordset });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ==================================================
// 🔹 UPDATE TABLES
// ==================================================
async function getPrimaryKeyColumn(table) {
  try {
    const pk = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + CONSTRAINT_NAME), 'IsPrimaryKey') = 1
      AND TABLE_NAME = '${table}'
    `);
    if (pk.recordset.length > 0) return pk.recordset[0].COLUMN_NAME;

    const fallback = await pool.request().query(`
      SELECT TOP 1 COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);
    return fallback.recordset[0]?.COLUMN_NAME || null;
  } catch {
    return null;
  }
}

app.post("/update", async (req, res) => {
  if (!pool) {
    return res.status(400).json({ success: false, error: "Belum terkoneksi ke database." });
  }

  const { table, rows, deleted } = req.body;
  if (!table) {
    return res.status(400).json({ success: false, error: "Nama tabel tidak ditemukan dari query." });
  }

  try {
    const pk = await getPrimaryKeyColumn(table);
    if (!pk) {
      return res.status(400).json({
        success: false,
        error: `Tidak bisa menentukan kolom kunci (primary key) untuk tabel ${table}`,
      });
    }

    const poolRequest = pool.request();

    // 🟢 UPDATE data
    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (!row[pk]) continue;
        const idValue = String(row[pk]).replace(/'/g, "''");

        const updates = Object.entries(row)
          .filter(([key]) => key !== pk)
          .map(([key, val]) => `[${key}] = '${String(val ?? "").replace(/'/g, "''")}'`)
          .join(", ");

        const sqlUpdate = `UPDATE [${table}] SET ${updates} WHERE [${pk}] = '${idValue}'`;
        console.log("🧩 UPDATE:", sqlUpdate);
        await poolRequest.query(sqlUpdate);
      }
    }

    // 🔴 DELETE data
    if (deleted && deleted.length > 0) {
      for (const row of deleted) {
        if (!row[pk]) continue;
        const idValue = String(row[pk]).replace(/'/g, "''");
        const sqlDelete = `DELETE FROM [${table}] WHERE [${pk}] = '${idValue}'`;
        console.log("🗑️ DELETE:", sqlDelete);
        await poolRequest.query(sqlDelete);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error update:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ==================================================
// 📊 Tables & Columns
// ==================================================
app.get("/tables", async (req, res) => {
  try {
    if (!pool) return res.status(400).json({ success: false, error: "Belum konek." });
    const result = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME
    `);
    res.json(result.recordset.map(r => r.TABLE_NAME));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/columns/:table", async (req, res) => {
  try {
    if (!pool) return res.status(400).json({ success: false, error: "Belum konek." });
    const { table } = req.params;
    const result = await pool.request().query(`
      SELECT COLUMN_NAME AS columnName, DATA_TYPE AS dataType,
      COALESCE(CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR), '') AS maxLength,
      IS_NULLABLE AS isNullable
      FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='${table}'
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================================
// 🧩 Tutorial local JSON (tidak hilang di EXE)
// ==================================================
app.post("/tutorials", (req, res) => {
  const { title, steps } = req.body;
  if (!steps?.length) return res.json({ success: false, error: "Tidak ada langkah." });
  const id = randomUUID();
  const data = { id, title, steps, date: new Date().toLocaleString("id-ID") };
  fs.writeFileSync(path.join(tutorialsDir, `${id}.json`), JSON.stringify(data, null, 2));
  res.json({ success: true, url: `${API_BASE}/tutorial/${id}` });
});

app.get("/tutorials", (req, res) => {
  try {
    const files = fs.readdirSync(tutorialsDir).filter(f => f.endsWith(".json"));
    const list = files.map(f => {
      const d = JSON.parse(fs.readFileSync(path.join(tutorialsDir, f)));
      return { id: d.id, title: d.title, date: d.date };
    });
    res.json({ success: true, tutorials: list });
  } catch (err) {
    res.json({ success: false, tutorials: [], error: err.message });
  }
});

app.get("/tutorial/:id", async (req, res) => {
  const id = req.params.id;
  const fs = require("fs");
  const file = path.join(tutorialsDir, `${req.params.id}.json`);
  if (!fs.existsSync(file)) return res.status(404).send("❌ Tidak ditemukan");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  const stepsHTML = data.steps
    .map(
      (s, i) => `
      <div class="step-card">
        <div class="step-number">Langkah ${i + 1}</div>
        <div class="step-body">
          ${s.image
          ? `<div class="image-wrap"><img src="${s.image}" alt="Langkah ${i + 1}" /></div>`
          : `<div class="image-wrap no-image">📷 (Tidak ada gambar)</div>`
        }
          <div class="step-text">
            ${s.text || ""}
          </div>
        </div>
      </div>
    `
    )
    .join("");

  const html = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${data.title}</title>
    <style>
      body {
        font-family: "Inter", "Segoe UI", sans-serif;
        background: #0d0d13;
        color: #f5f5f5;
        margin: 0;
        padding: 40px 20px;
      }

      .container {
        max-width: 1000px;
        margin: 0 auto;
        background: #1a1a24;
        padding: 40px 50px;
        border-radius: 20px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        animation: fadeIn 0.5s ease-in-out;
      }

      h1 {
        color: #a882ff;
        font-size: 2rem;
        margin-bottom: 8px;
        text-transform: capitalize;
      }

      .date {
        color: #aaa;
        font-size: 14px;
        margin-bottom: 35px;
        border-bottom: 1px solid #2e2e3e;
        padding-bottom: 10px;
      }

      .step-card {
        background: #222233;
        border-radius: 16px;
        padding: 25px;
        margin-bottom: 35px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      }

      .step-card:hover {
        background: #2b2b3d;
        transform: translateY(-3px);
      }

      .step-number {
        color: #9b7bff;
        font-weight: 600;
        font-size: 18px;
        margin-bottom: 20px;
        text-transform: uppercase;
      }

      .step-body {
        display: flex;
        align-items: flex-start;
        gap: 25px;
      }

      .image-wrap {
        flex: 0 0 40%;
      }

      .image-wrap img {
        width: 100%;
        border-radius: 12px;
        box-shadow: 0 0 15px rgba(0,0,0,0.5);
        display: block;
      }

      .no-image {
        background: #333344;
        color: #bbb;
        text-align: center;
        border-radius: 10px;
        padding: 30px;
      }

      .step-text {
        flex: 1;
        font-size: 1.15rem;
        line-height: 1.8;
        color: #e0e0e0;
        white-space: pre-line;
        background: rgba(255,255,255,0.03);
        border-left: 4px solid #6b4cff;
        padding: 20px 25px;
        border-radius: 10px;
        min-height: 100%;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (max-width: 768px) {
        .step-body {
          flex-direction: column;
        }
        .image-wrap {
          flex: 1 1 100%;
        }
        .step-text {
          margin-top: 15px;
        }
        .container {
          padding: 25px 20px;
        }
        h1 {
          font-size: 1.6rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${data.title}</h1>
      <div class="date">${data.date}</div>
      ${stepsHTML}
    </div>
  </body>
  </html>
  `;

  res.send(html);
});

app.delete("/tutorials/:id", (req, res) => {
  const f = path.join(tutorialsDir, `${req.params.id}.json`);
  if (!fs.existsSync(f)) return res.status(404).json({ success: false });
  fs.unlinkSync(f);
  res.json({ success: true });
});

// ==================================================
// 🚀 Jalankan Server
// ==================================================
function findFreePort(start, cb) {
  const srv = net.createServer();
  srv.listen(start, () => srv.close(() => cb(start)));
  srv.on("error", () => findFreePort(start + 1, cb));
}

findFreePort(5000, port => {
  app.listen(port, () => {
    console.log(`✅ Server aktif di ${API_BASE}:${port}`);
    console.log(`📂 BaseDir: ${baseDir}`);
  });
});
