const sql = require("mssql");

const config = {
  user: "sa",
  password: "Team234IT",
  server: "ALS-TRADE\\SQLEXPRESS",
  database: "dbsis",
  options: {
    encrypt: false,               // <— matikan enkripsi SSL
    trustServerCertificate: true, // <— wajib untuk SQL lama
    port: 58624
  },
};


async function testConnection() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT name FROM sys.tables");
    console.log("✅ Koneksi berhasil, tabel di DB:", result.recordset);
  } catch (err) {
    console.error("❌ Gagal konek:", err.message);
  }
}

testConnection();
