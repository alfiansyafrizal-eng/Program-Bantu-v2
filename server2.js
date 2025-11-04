#!/usr/bin/env node
// === server.js ===
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


const { v4: uuidv4 } = require("uuid");
// ✅ Gunakan folder kerja aktif saat ini untuk versi EXE
let baseDir;
if (process.pkg) {
  // Saat dijalankan dari .exe (pkg)
  baseDir = process.cwd();
} else {
  // Saat dijalankan pakai node server.js
  baseDir = __dirname;
}

const tutorialDir = path.join(baseDir, "tutorials");

// Pastikan folder tutorials bisa dibuat
if (!fs.existsSync(tutorialDir)) {
  try {
    fs.mkdirSync(tutorialDir, { recursive: true });
    console.log("📁 Folder tutorials dibuat di:", tutorialDir);
  } catch (err) {
    console.error("❌ Gagal membuat folder tutorials:", err);
  }
}

// ✅ Pastikan Express serve file dari baseDir
app.use(express.static(baseDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(baseDir, "dashbord.html"));
});


// 🔹 Sajikan semua file di folder utama (HTML, JS, CSS, dll)
app.use(express.static(baseDir));

// 🔹 Root route — arahkan ke login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(baseDir, "login.html"));
});

// 🔹 Route fallback untuk semua file HTML langsung
app.get("/:page", (req, res, next) => {
  const filePath = path.join(baseDir, req.params.page);
  if (fs.existsSync(filePath) && filePath.endsWith(".html")) {
    res.sendFile(filePath);
  } else {
    next();
  }
});


// ==================================================
// 🔧 Variabel koneksi global
// ==================================================
let pool = null;
let currentConnection = null;

// ==================================================
// 🔹 1️⃣ Endpoint: Tes & Simpan Koneksi Database
// ==================================================
// ==================================================
// 🔹 1️⃣ Endpoint: Tes & Simpan Koneksi Database (FIX koneksi baru salah password)
// ==================================================
app.post("/connect", async (req, res) => {
  const { server, port, user, password, database } = req.body;

  const config = {
    user,
    password,
    server,
    database,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      port: port ? parseInt(port) : 1433,
    },
  };

  try {
    // 🔹 Buat koneksi baru hanya untuk tes
    const testPool = new sql.ConnectionPool(config);
    await testPool.connect();
    await testPool.request().query("SELECT 1 AS test");

    // ✅ Jika sukses: tutup pool lama dulu
    if (pool) {
      try {
        await pool.close();
        console.log("🔁 Pool lama ditutup sebelum koneksi baru dibuka");
      } catch (closeErr) {
        console.warn("⚠️ Gagal menutup pool lama:", closeErr.message);
      }
    }

    // ✅ Simpan pool & config baru
    pool = testPool;
    currentConnection = config;

    res.json({ success: true, message: "Koneksi berhasil" });
  } catch (err) {
    console.error("❌ Gagal konek:", err.message);

    // ❗ Kalau gagal koneksi baru, jangan ganti pool lama
    res.json({ success: false, error: "Gagal konek: " + err.message });
  }
});


// ==================================================
// 🔹 2️⃣ Endpoint: Jalankan Query SQL
// ==================================================
app.post("/query", async (req, res) => {
  const { sqlQuery } = req.body;

  if (!pool) {
    return res.json({ success: false, error: "Belum ada koneksi aktif." });
  }

  try {
    const result = await pool.request().query(sqlQuery);
    res.json({ success: true, rows: result.recordset });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ==================================================
// 🔹 3️⃣ Helper: Ambil nama kolom primary key
// ==================================================
async function getPrimaryKeyColumn(table) {
  try {
    const pkResult = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + CONSTRAINT_NAME), 'IsPrimaryKey') = 1
      AND TABLE_NAME = '${table}'
    `);

    if (pkResult.recordset.length > 0) {
      return pkResult.recordset[0].COLUMN_NAME;
    }

    // Fallback ke kolom pertama kalau tidak ada PK
    const colResult = await pool.request().query(`
      SELECT TOP 1 COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);

    return colResult.recordset[0]?.COLUMN_NAME || null;
  } catch (err) {
    console.error("❌ Gagal deteksi PK:", err);
    return null;
  }
}

// ==================================================
// 🔹 4️⃣ Endpoint: Update & Delete data dari tabel
// ==================================================
app.post("/update", async (req, res) => {
  if (!pool) {
    return res.status(400).json({ success: false, error: "Belum terkoneksi ke database." });
  }

  const { table, rows, deleted } = req.body;

  if (!table) {
    return res.status(400).json({ success: false, error: "Nama tabel tidak ditemukan dari query." });
  }

  try {
    const primaryKey = await getPrimaryKeyColumn(table);
    if (!primaryKey) {
      return res.status(400).json({
        success: false,
        error: `Tidak bisa menentukan kolom kunci untuk tabel ${table}`,
      });
    }

    const poolRequest = pool.request();

    // 🟢 UPDATE
    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (!row[primaryKey]) continue;
        const idValue = row[primaryKey];
        const updates = Object.entries(row)
          .filter(([k]) => k !== primaryKey)
          .map(([k, v]) => `[${k}] = '${String(v).replace(/'/g, "''")}'`)
          .join(", ");
        const sqlQuery = `UPDATE ${table} SET ${updates} WHERE [${primaryKey}] = '${idValue}'`;
        console.log("🧩 UPDATE:", sqlQuery);
        await poolRequest.query(sqlQuery);
      }
    }

    // 🔴 DELETE
    if (deleted && deleted.length > 0) {
      for (const row of deleted) {
        if (!row[primaryKey]) continue;
        const idValue = row[primaryKey];
        const sqlQuery = `DELETE FROM ${table} WHERE [${primaryKey}] = '${idValue}'`;
        console.log("🗑️ DELETE:", sqlQuery);
        await poolRequest.query(sqlQuery);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error update:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================================
// 🔹 5️⃣ Endpoint: Ambil daftar tabel (untuk autocomplete & structure)
// ==================================================
app.get("/tables", async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, error: "Belum terkoneksi ke database." });
    }

    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    res.json(result.recordset.map(r => r.TABLE_NAME));
  } catch (err) {
    console.error("❌ Error ambil daftar tabel:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================================
// 🔹 6️⃣ Endpoint: Ambil nama kolom (untuk autocomplete editor)
// ==================================================
app.get("/columns-names/:table", async (req, res) => {
  try {
    if (!pool) return res.status(400).json([]);
    const { table } = req.params;

    const result = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);

    res.json(result.recordset.map(r => r.COLUMN_NAME));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================================================
// 🔹 7️⃣ Endpoint: Ambil struktur kolom (nama, tipe, panjang, nullable)
// ==================================================
app.get("/columns/:table", async (req, res) => {
  try {
    if (!pool) {
      return res.status(400).json({ success: false, error: "Belum terkoneksi ke database." });
    }

    const { table } = req.params;

    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME AS columnName,
        DATA_TYPE AS dataType,
        COALESCE(CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR), '') AS maxLength,
        IS_NULLABLE AS isNullable
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================================================
// 🚀 Jalankan server
// ==================================================
// ==================================================
// 🔄 Jalankan server dengan port otomatis
// ==================================================
const net = require("net");

function findFreePort(startPort, callback) {
  const server = net.createServer();
  server.listen(startPort, () => {
    server.once("close", () => callback(startPort));
    server.close();
  });
  server.on("error", () => findFreePort(startPort + 1, callback)); // coba port berikutnya
}

// === FITUR TUTORIAL ===
//const fs = require("fs");
const { randomUUID } = require("crypto");
const tutorialsDir = path.join(__dirname, "tutorials");

// Buat folder "tutorials" jika belum ada
if (!fs.existsSync(tutorialsDir)) fs.mkdirSync(tutorialsDir, { recursive: true });

// 🔹 Simpan tutorial baru
app.post("/tutorials", (req, res) => {
  const { title, steps } = req.body;
  if (!steps || steps.length === 0) {
    return res.json({ success: false, error: "Tidak ada langkah dikirim." });
  }

  const id = randomUUID();
  const data = {
    id,
    title: title || "Tanpa Judul",
    steps,
    date: new Date().toLocaleString("id-ID"),
  };

  try {
    fs.writeFileSync(path.join(tutorialsDir, `${id}.json`), JSON.stringify(data, null, 2));
    res.json({ success: true, url: `/tutorial/${id}` });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// 🔹 Ambil semua tutorial (untuk tabel daftar)
app.get("/tutorials", (req, res) => {
  try {
    const files = fs.readdirSync(tutorialsDir).filter(f => f.endsWith(".json"));
    const tutorials = files.map(file => {
      const t = JSON.parse(fs.readFileSync(path.join(tutorialsDir, file), "utf8"));
      return {
        id: t.id,
        title: t.title,
        date: t.date,
        url: `/tutorial/${t.id}`,
      };
    });
    res.json({ success: true, tutorials });
  } catch (err) {
    res.json({ success: false, error: err.message, tutorials: [] });
  }
});

// 🔹 Tampilkan 1 tutorial publik (untuk link hasil generate)
app.get("/tutorial/:id", async (req, res) => {
  const id = req.params.id;
  const fs = require("fs");
  const filePath = path.join(__dirname, "tutorials", `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("<h2>Tutorial tidak ditemukan</h2>");
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

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

app.delete("/tutorials/:id", async (req, res) => {
  const file = path.join(tutorialPath, `${req.params.id}.json`);
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      return res.json({ success: true });
    } else {
      return res.status(404).json({ success: false, error: "File tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/tutorial/:id", async (req, res) => {
  const file = path.join(tutorialPath, `${req.params.id}.json`);
  if (!fs.existsSync(file)) {
    return res.status(404).send("<h3 style='color:white;background:#111;padding:20px'>❌ Tutorial tidak ditemukan.</h3>");
  }

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));

  // Jika print=true → tampilkan mode siap cetak (PDF)
  if (req.query.print === "true") {
    let html = `
      <html>
      <head>
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; background: #fafafa; color: #333; padding: 30px; }
          .step { margin-bottom: 30px; }
          .step img { max-width: 100%; border-radius: 8px; box-shadow: 0 0 6px rgba(0,0,0,0.2); }
          .step p { margin-top: 10px; font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        ${data.steps.map((s, i) => `
          <div class="step">
            ${s.image ? `<img src="${s.image}" />` : ""}
            <p><b>Langkah ${i + 1}:</b> ${s.text}</p>
          </div>`).join("")}
      </body>
      </html>`;
    return res.send(html);
  }

  // Preview biasa (theme gelap)
  let html = `
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        body { background:#0d0d15; color:#ddd; font-family:'Segoe UI',sans-serif; padding:30px; }
        h1 { color:#a882ff; border-bottom:1px solid #2a2a3a; padding-bottom:10px; }
        .step { margin:25px 0; display:flex; align-items:flex-start; gap:20px; background:#1a1a2d; padding:15px; border-radius:12px; }
        .step img { max-width:320px; border-radius:10px; box-shadow:0 0 8px rgba(0,0,0,0.3); }
        .step p { font-size:16px; line-height:1.5; color:#ddd; }
      </style>
    </head>
    <body>
      <h1>📘 ${data.title}</h1>
      ${data.steps.map((s, i) => `
        <div class="step">
          ${s.image ? `<img src="${s.image}" alt="Step ${i + 1}">` : ""}
          <p><b>Langkah ${i + 1}:</b><br>${s.text}</p>
        </div>
      `).join("")}
    </body>
    </html>`;
  // Tambahkan JSON data embed untuk editor
  html += `<script id="data" type="application/json">${JSON.stringify(data)}</script>`;
  res.send(html);
});

// ✅ Endpoint download PDF langsung
//const { jsPDF } = require("jspdf");
 // kalau pakai module, tapi kalau tidak ada import ini cukup tambahkan require di atas:
// const { jsPDF } = require("jspdf");
/*
app.get("/tutorial/:id/pdf", (req, res) => {
  const id = req.params.id;
  const file = path.join(tutorialPath, `${id}.json`);
  if (!fs.existsSync(file)) {
    return res.status(404).send("Tutorial tidak ditemukan");
  }

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  const doc = new jsPDF();

  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.title, 10, y);
  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Tanggal: ${data.date}`, 10, y);
  y += 10;

  data.steps.forEach((s, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`Langkah ${i + 1}:`, 10, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(s.text || "", 180);
    doc.text(lines, 10, y);
    y += lines.length * 7 + 5;
  });

  const fileName = `${data.title.replace(/\s+/g, "_")}.pdf`;
  const pdf = doc.output();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(Buffer.from(pdf, "binary"));
});
*/


findFreePort(5000, (port) => {
  app.listen(port, () => console.log(`✅ Server aktif di http://localhost:${port}`));
});

