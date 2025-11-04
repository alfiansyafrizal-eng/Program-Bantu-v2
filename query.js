// === query.js ===
// Pastikan <textarea id="queryInput"> dan <div id="resultArea"> ada di HTML

let editor;
let tableHints = [];
window.deletedRows = [];

// === 🔍 Deteksi tabel utama dari query ===
function detectMainTable(sqlQuery) {
  const match = sqlQuery.match(/\bFROM\s+([a-zA-Z0-9_\[\]]+)/i);
  return match ? match[1].replace(/[\[\]]/g, "") : null;
}

// === 🎨 Render hasil query ke tabel ===
function renderTable(rows) {
  const output = document.getElementById("resultArea");

  if (!rows || rows.length === 0) {
    output.innerHTML = "<div class='empty'>⚠️ Tidak ada hasil.</div>";
    return;
  }

  const headers = Object.keys(rows[0]);
  if (!window.sortState) window.sortState = {};

  let html = `
    <table class="result-table">
      <thead><tr>
        ${headers.map(h => `<th data-col="${h}">${h} <span class="sort-icon">${window.sortState[h] === "asc" ? "▲" : window.sortState[h] === "desc" ? "▼" : ""}</span></th>`).join("")}
      </tr></thead>
      <tbody>
        ${rows.map((row, i) => `<tr data-row="${i}">${headers.map(h => `<td contenteditable="true">${row[h] ?? ""}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;

  output.innerHTML = html;
  const table = output.querySelector("table");
  const ths = table.querySelectorAll("th[data-col]");
  const trs = table.querySelectorAll("tbody tr");

  // === Sorting header ===
  ths.forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.col;
      const currentState = window.sortState[col];
      const nextState = currentState === "asc" ? "desc" : "asc";
      window.sortState = { [col]: nextState };

      rows.sort((a, b) => {
        if (a[col] == null) return 1;
        if (b[col] == null) return -1;
        if (a[col] === b[col]) return 0;
        return nextState === "asc" ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1);
      });

      renderTable(rows);
    });
  });

  // === Pilih baris ===
  trs.forEach(tr => {
    tr.addEventListener("click", () => {
      trs.forEach(t => t.classList.remove("selected-row"));
      tr.classList.add("selected-row");
      window.selectedRowIndex = Number(tr.dataset.row);
    });
  });

  // === Delete via keyboard ===
  document.onkeydown = e => {
    if (e.key === "Delete" && window.selectedRowIndex != null) {
      const idx = window.selectedRowIndex;
      const deleted = rows.splice(idx, 1)[0];
      if (deleted) {
        window.deletedRows = window.deletedRows || [];
        window.deletedRows.push(deleted);
        showNotification("🗑️ Baris dihapus (tekan Submit untuk menyimpan)", "error");
      }
      renderTable(rows);
      window.selectedRowIndex = null;
    }
  };

  window.editedRows = rows;
}

// === 🔔 Notifikasi kecil ===
function showNotification(msg, type = "success") {
  const box = document.getElementById("notifyBox");
  if (!box) return;
  box.textContent = msg;
  box.className = `notify show ${type}`;
  setTimeout(() => (box.className = "notify"), 3000);
}

// === 🔄 Ambil daftar tabel dari server ===
async function loadTableHints() {
  try {
    const res = await fetch("/tables");
    tableHints = await res.json();
    console.log("Daftar tabel:", tableHints);
  } catch (err) {
    console.error("Gagal ambil daftar tabel:", err);
  }
}

// === 🚀 Inisialisasi utama ===
document.addEventListener("DOMContentLoaded", () => {
  // === 🔁 RESET KONEKSI SAAT REFRESH ATAU PINDAH MENU ===
  // === 🔁 RESET KONEKSI SAAT REFRESH SAJA (tidak saat pindah menu) ===
  window.isConnected = false;
  window.connectionInfo = null;
  window.lastTableName = null;
  window.deletedRows = [];

  const connInfo = document.getElementById("connectionInfo");
  if (connInfo) connInfo.innerHTML = "🔴 Tidak terhubung ke server";

  const btnExecutequery = document.getElementById("btnExecutequery");
  const btnStructure = document.getElementById("btnStructure");
  const btnSubmit = document.getElementById("btnSubmit");

  // Nonaktifkan tombol hanya saat refresh (awal halaman dibuka)
  [btnExecutequery, btnStructure, btnSubmit].forEach(btn => {
    if (btn) btn.disabled = true;
  });


  // === 💡 CodeMirror ===
  editor = CodeMirror.fromTextArea(document.getElementById("queryInput"), {
    mode: "text/x-sql",
    theme: "material-darker",
    lineNumbers: true,
    autofocus: true,
    extraKeys: {
      "Ctrl-Space": "autocomplete",
      "Alt-X": () => {
        if (!window.isConnected) {
          showNotification("⚠️ Harap buka koneksi terlebih dahulu!", "error");
          return;
        }
        executeQuery();
      },
    },
  });

  const sqlKeywords = [
    "SELECT", "FROM", "WHERE", "UPDATE", "DELETE", "INSERT", "INTO", "VALUES",
    "SET", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN",
    "GROUP BY", "ORDER BY", "HAVING", "AS", "DISTINCT", "TOP", "LIMIT",
    "AND", "OR", "NOT", "NULL", "IS", "IN", "BETWEEN", "LIKE", "ON"
  ];

  const columnCache = {};

  // === ✨ Autocomplete ===
  editor.on("inputRead", async function (cm, change) {
    if (!change.text[0].match(/[A-Za-z_.]/)) return;
    const cursor = cm.getCursor();
    const token = cm.getTokenAt(cursor);
    const start = { line: cursor.line, ch: token.start };
    const end = { line: cursor.line, ch: token.end };
    const currentWord = token.string.toLowerCase();
    let list = [];

    const textBefore = cm.getRange({ line: 0, ch: 0 }, cursor).toUpperCase();

    if (currentWord.length <= 10)
      list = sqlKeywords.filter(k => k.toLowerCase().startsWith(currentWord));

    if (/\b(FROM|JOIN|UPDATE|INTO)\s+[A-Za-z0-9_]*$/i.test(textBefore))
      list = tableHints.filter(t => t.toLowerCase().includes(currentWord));

    const matches = textBefore.match(/\b(?:FROM|UPDATE|JOIN|INTO)\s+([A-Za-z0-9_]+)/gi);
    let activeTable = matches?.length ? matches[matches.length - 1].split(/\s+/)[1] : null;

    // === Autocomplete kolom dari tabel aktif ===
    if (
      activeTable &&
      (/\b(WHERE|SET|ON|AND|OR)\b\s*[A-Za-z0-9_]*$/i.test(textBefore) || token.string.includes("."))
    ) {
      try {
        // Pastikan cache aman
        if (!columnCache[activeTable]) {
          const res = await fetch(`/columns/${activeTable}`); // ✅ route disesuaikan dengan server.js
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          // kalau server kirim array berisi objek kolom
          if (Array.isArray(data)) {
            columnCache[activeTable] = data.map(c => c.columnName || c.COLUMN_NAME);
          } else if (Array.isArray(data.columns)) {
            columnCache[activeTable] = data.columns;
          } else {
            columnCache[activeTable] = [];
          }
        }

        const cols = Array.isArray(columnCache[activeTable])
          ? columnCache[activeTable]
          : [];

        list = cols.filter(c =>
          c.toLowerCase().includes(currentWord.toLowerCase())
        );
      } catch (err) {
        console.warn("Gagal ambil kolom dari", activeTable, err.message);
        list = [];
      }
    }


    if (list.length)
      cm.showHint({ hint: () => ({ list, from: start, to: end }), completeSingle: false });
  });

  editor.on("keyup", (cm, e) => {
    if (!cm.state.completionActive && e.key.length === 1)
      CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
  });

  // === 📂 Tombol STRUCTURE ===
  btnStructure.addEventListener("click", async () => {
    const output = document.getElementById("resultArea");
    output.innerHTML = "<div class='loading'>📂 Memuat daftar tabel...</div>";

    try {
      const res = await fetch("http://localhost:5000/tables");
      const tables = await res.json();

      if (!Array.isArray(tables) || tables.length === 0) {
        output.innerHTML = "<div class='warn'>⚠️ Tidak ada tabel ditemukan.</div>";
        return;
      }

      // === Tampilkan daftar tabel + pencarian ===
      let html = `
        <div class="table-list-container">
          <div class="table-list-header">
            <h3><i class="bi bi-database"></i> Daftar Tabel</h3>
            <input type="text" id="tableSearch" class="table-search" placeholder="🔍 Cari tabel...">
          </div>
          <ul id="tableList" class="table-list">
            ${tables.map(t => `<li class="table-item" data-table="${t}"><i class="bi bi-table"></i> ${t}</li>`).join("")}
          </ul>
        </div>`;
      output.innerHTML = html;

      // 🔎 Filter daftar tabel saat user mengetik
      const searchInput = document.getElementById("tableSearch");
      const tableList = document.getElementById("tableList");
      searchInput.addEventListener("input", () => {
        const term = searchInput.value.toLowerCase();
        tableList.querySelectorAll(".table-item").forEach(li => {
          const name = li.textContent.toLowerCase();
          li.style.display = name.includes(term) ? "block" : "none";
        });
      });

      // 🧩 Double-click tabel → ambil struktur kolom
      document.querySelectorAll(".table-item").forEach(el => {
        el.addEventListener("dblclick", async () => {
          const tableName = el.dataset.table;
          output.innerHTML = `<div class='loading'>🔍 Memuat struktur tabel <b>${tableName}</b>...</div>`;

          try {
            const res = await fetch(`http://localhost:5000/columns/${tableName}`);
            const cols = await res.json();

            if (!Array.isArray(cols) || cols.length === 0) {
              output.innerHTML = `<div class='warn'>⚠️ Tidak ada kolom di tabel <b>${tableName}</b>.</div>`;
              return;
            }

            // ✅ Render struktur kolom
            let html = `
              <div class="table-structure">
                <h3><i class="bi bi-diagram-3"></i> Struktur Tabel: ${tableName}</h3>
                <table class="result-table">
                  <thead>
                    <tr>
                      <th>Nama Kolom</th>
                      <th>Tipe Data</th>
                      <th>Panjang</th>
                      <th>Nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cols.map(c => `
                      <tr>
                        <td>${c.columnName}</td>
                        <td>${c.dataType}</td>
                        <td>${c.maxLength}</td>
                        <td>${c.isNullable}</td>
                      </tr>`).join("")}
                  </tbody>
                </table>
              </div>`;
            output.innerHTML = html;
          } catch (err) {
            output.innerHTML = `<div class='error'>❌ Gagal ambil struktur tabel: ${err.message}</div>`;
          }
        });
      });
    } catch (err) {
      output.innerHTML = `<div class='error'>❌ Gagal ambil daftar tabel: ${err.message}</div>`;
    }
  });


  // === 🔗 Koneksi SQL ===
  const connectionForm = document.getElementById("connectionForm");
  const btnNew = document.getElementById("btnNew");
  const btnConnect = document.getElementById("btnConnect");
  const connectStatus = document.getElementById("connectStatus");

  btnNew.addEventListener("click", () => {
    connectionForm.style.display = connectionForm.style.display === "flex" ? "none" : "flex";
    connectStatus.textContent = "";
    [btnExecutequery, btnStructure, btnSubmit].forEach(btn => (btn.disabled = true));
  });

  btnConnect.addEventListener("click", async () => {
    const server = serverInput.value.trim();
    const port = portInput.value.trim();
    const user = userInput.value.trim();
    const password = passwordInput.value.trim();
    const database = dbInput.value.trim();

    if (!server || !user || !port || !password || !database) {
      connectStatus.textContent = "⚠️ Semua field wajib diisi.";
      connectStatus.className = "connect-status error";
      return;
    }

    connectStatus.textContent = "🔄 Menguji koneksi...";
    connectStatus.className = "connect-status";

    try {
      const res = await fetch("http://localhost:5000/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server, port, user, password, database }),
      });
      const data = await res.json();

      if (data.success) {
        window.isConnected = true;
        window.connectionInfo = { server, port, user, password, database };
        connectStatus.textContent = "✅ Koneksi berhasil!";
        connectStatus.className = "connect-status success";
        connInfo.innerHTML = `🟢 Terhubung ke <b>${server}</b> — Database: <b>${database}</b>`;
        [btnExecutequery, btnStructure, btnSubmit].forEach(btn => (btn.disabled = false));
        loadTableHints();
        setTimeout(() => (connectionForm.style.display = "none"), 1000);
      } else {
        window.isConnected = false;
        connectStatus.textContent = `❌ ${data.error}`;
        connectStatus.className = "connect-status error";
        [btnExecutequery, btnStructure, btnSubmit].forEach(btn => (btn.disabled = true));
      }
    } catch (err) {
      connectStatus.textContent = `🚫 Gagal konek ke backend: ${err.message}`;
      connectStatus.className = "connect-status error";
    }
  });

  // === 💾 Submit perubahan ===
  btnSubmit.addEventListener("click", async () => {
    const table = window.lastTableName || null;
    const lastQuery = editor.getValue();
    const rows = [];

    const tableEl = document.querySelector(".result-table");
    if (!tableEl) return;

    const headers = Array.from(tableEl.querySelectorAll("thead th")).map(th => th.innerText.trim());
    tableEl.querySelectorAll("tbody tr").forEach(tr => {
      const cells = tr.querySelectorAll("td");
      const row = {};
      headers.forEach((h, i) => (row[h] = cells[i].innerText.trim()));
      rows.push(row);
    });

    try {
      const res = await fetch("http://localhost:5000/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, rows, deleted: window.deletedRows || [], lastQuery }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("✅ Perubahan berhasil disimpan!", "success");
        window.deletedRows = [];
      } else {
        showNotification(`❌ ${data.error}`, "error");
      }
    } catch (err) {
      showNotification(`🚫 Gagal update: ${err.message}`, "error");
    }
  });

  // === ▶️ Jalankan query ===
  async function executeQuery() {
    const sqlQuery = editor.getSelection().trim() || editor.getValue().trim();
    const output = document.getElementById("resultArea");
    if (!sqlQuery) return (output.innerHTML = "<div class='warn'>⚠️ Tidak ada query untuk dijalankan.</div>");

    output.innerHTML = "<div class='loading'>⏳ Menjalankan query...</div>";
    try {
      const res = await fetch("http://localhost:5000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sqlQuery }),
      });
      const data = await res.json();

      if (data.success) {
        window.lastTableName = detectMainTable(sqlQuery);
        renderTable(data.rows);
        showNotification("✅ Query berhasil dijalankan", "success");
      } else {
        output.innerHTML = `<div class='error'>❌ ${data.error}</div>`;
      }
    } catch (err) {
      output.innerHTML = `<div class='error'>❌ Gagal konek ke server: ${err.message}</div>`;
      showNotification("🚫 Gagal konek ke server", "error");
    }
  }

  btnExecutequery.addEventListener("click", executeQuery);
});

// === 🕒 Real-time Date & Time ===
function updateDateTime() {
  const el = document.getElementById("dateTimeInfo");
  if (!el) return;
  const now = new Date();
  el.innerHTML = "🕒 " + now.toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
setInterval(updateDateTime, 1000);
updateDateTime();
