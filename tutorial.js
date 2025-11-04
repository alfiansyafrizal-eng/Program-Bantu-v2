// 🔧 Fungsi kompres & resize gambar otomatis sebelum upload
async function compressImage(file, maxWidth = 1280, maxHeight = 720, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const btnNewTutorial = document.getElementById("btnNewTutorial");
    const tutorialEditor = document.getElementById("tutorialEditor");
    const stepsContainer = document.getElementById("stepsContainer");
    const btnAddStep = document.getElementById("addStep");
    const btnSaveTutorial = document.getElementById("btnSaveTutorial");
    const btnCancelTutorial = document.getElementById("btnCancelTutorial");
    const tutorialTitleInput = document.getElementById("tutorialTitleInput");
    const tutorialList = document.getElementById("tutorialList");

    // Buka menu Tutorial
    document.getElementById("tutorial").addEventListener("click", () => {
        document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
        document.getElementById("content-tutorial").classList.add("active");
    });

    // Buka popup editor
    btnNewTutorial.addEventListener("click", () => {
        tutorialEditor.style.display = "flex";
        stepsContainer.innerHTML = "";
        tutorialTitleInput.value = "";
    });

    // Tutup popup
    btnCancelTutorial.addEventListener("click", () => {
        tutorialEditor.style.display = "none";
    });

    // Tambah langkah baru
    btnAddStep.addEventListener("click", () => {
        const step = document.createElement("div");
        step.className = "tutorial-step";
        step.innerHTML = `
      <div class="form-horizontal">
        <div class="form-group">
          <label>Gambar</label>
          <input type="file" accept="image/*" class="form-control step-image">
        </div>
        <div class="form-group">
          <label>Keterangan</label>
          <textarea class="form-control step-text" rows="3" placeholder="Tulis keterangan langkah ini..."></textarea>
        </div>
        <div class="form-group">
          <button class="btn-execute btn-remove"><i class="bi bi-trash"></i> Hapus</button>
        </div>
      </div>
    `;
        stepsContainer.appendChild(step);
        step.querySelector(".btn-remove").addEventListener("click", () => step.remove());
    });

    // Simpan tutorial
    btnSaveTutorial.addEventListener("click", async () => {
        const title = tutorialTitleInput.value.trim();
        if (!title) return alert("Masukkan judul tutorial dulu!");

        const steps = [];
        for (const step of stepsContainer.querySelectorAll(".tutorial-step")) {
            const text = step.querySelector(".step-text").value.trim();
            const file = step.querySelector(".step-image").files[0];
            let image = null;
            if (file) {
                image = await compressImage(file);
            }
            steps.push({ text, image });
        }

        if (steps.length === 0) return alert("Tambahkan minimal satu langkah.");

        const res = await fetch("/tutorials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, steps }),
        });

        const data = await res.json().catch(() => ({}));
        if (data.success) {
            alert("✅ Tutorial berhasil dibuat!");
            tutorialEditor.style.display = "none";
            loadTutorials();
        } else {
            alert("❌ Gagal: " + (data.error || "Tidak diketahui"));
        }
    });

    // Muat daftar tutorial
    async function loadTutorials() {
        tutorialList.innerHTML = "<div class='loading'>📂 Memuat daftar tutorial...</div>";

        try {
            const res = await fetch("/tutorials");
            const data = await res.json();

            if (!data.success || !data.tutorials?.length) {
                tutorialList.innerHTML = "<div class='warn'>⚠️ Belum ada tutorial.</div>";
                return;
            }

            const rows = data.tutorials.map((tut) => `
    <tr>
      <td>
        <!-- 🔹 div tambahan agar PDF bisa mendeteksi elemen -->
        <div id="tutorial-card-${tut.id}">
          ${tut.title}
        </div>
      </td>
      <td>${tut.date}</td>
      <td class="aksi">
        <button class="aksi-btn" title="Edit" onclick="editTutorial('${tut.id}')">
          <i class='bi bi-pencil-square'></i>
        </button>
        <button class="aksi-btn" title="Preview" onclick="previewTutorial('${tut.id}')">
          <i class='bi bi-eye'></i>
        </button>
        <button class="aksi-btn" title="Download PDF" onclick="downloadPDF('${tut.id}')">
          <i class='bi bi-file-earmark-pdf'></i>
        </button>
        <button class="aksi-btn" title="Share" onclick="shareTutorial('${tut.id}')">
          <i class='bi bi-share'></i>
        </button>
        <button class="aksi-btn delete" title="Hapus" onclick="deleteTutorial('${tut.id}')">
          <i class='bi bi-trash'></i>
        </button>
      </td>
    </tr>
  `).join("");

            tutorialList.innerHTML = `
    <table class="tutorial-table">
      <thead>
        <tr><th>Judul</th><th>Tanggal</th><th>Aksi</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
        } catch (err) {
            tutorialList.innerHTML = `<div class='error'>❌ Gagal ambil data tutorial: ${err.message}</div>`;
        }

    }

    loadTutorials();
});


// ✅ Jadikan fungsi aksi global agar dikenali onclick
// ✅ Jadikan fungsi aksi global agar dikenali onclick & sesuai tema dashboard
window.editTutorial = async (id) => {
    try {
        const res = await fetch(`/tutorial/${id}`);
        const html = await res.text();

        // Parse isi tutorial dari JSON embed (backend bisa tambahkan nanti)
        const match = html.match(/<script id="data" type="application\/json">(.+?)<\/script>/s);
        if (!match) {
            alert("❌ Gagal muat data tutorial untuk edit.");
            return;
        }

        const data = JSON.parse(match[1]);

        // Buka popup editor
        const editor = document.getElementById("tutorialEditor");
        const titleInput = document.getElementById("tutorialTitleInput");
        const stepsContainer = document.getElementById("stepsContainer");
        editor.style.display = "flex";
        titleInput.value = data.title;
        stepsContainer.innerHTML = "";

        // Muat ulang langkah-langkah lama
        for (const s of data.steps) {
            const step = document.createElement("div");
            step.className = "tutorial-step";
            step.innerHTML = `
        <div class="form-horizontal">
          <div class="form-group">
            <label>Gambar</label>
            <input type="file" accept="image/*" class="form-control step-image">
            ${s.image ? `<img src="${s.image}" class="preview-img" style="max-width:120px;border-radius:6px;margin-top:8px;">` : ""}
          </div>
          <div class="form-group">
            <label>Keterangan</label>
            <textarea class="form-control step-text" rows="3">${s.text || ""}</textarea>
          </div>
          <div class="form-group">
            <button class="btn-execute btn-remove"><i class="bi bi-trash"></i> Hapus</button>
          </div>
        </div>
      `;
            stepsContainer.appendChild(step);
            step.querySelector(".btn-remove").addEventListener("click", () => step.remove());
        }

        // Simpan ID aktif ke editor (untuk update nanti)
        editor.dataset.editId = id;

    } catch (err) {
        alert("❌ Gagal membuka tutorial untuk edit: " + err.message);
    }
};

// === Download PDF dengan tampilan sama seperti preview ===
// === Download PDF dengan tampilan sama seperti tabel (tanpa ubah layout) ===
async function downloadPDF(tutorialId) {
  try {
    // Pastikan elemen target ada
    const tutorialCard = document.querySelector(`#tutorial-card-${tutorialId}`);
    if (!tutorialCard) {
      alert("❌ Tidak bisa menemukan elemen tutorial untuk diunduh.");
      return;
    }

    // Import library dari CDN
    const [{ jsPDF }, html2canvas] = await Promise.all([
      import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js"),
      import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js")
    ]);

    // Render elemen ke canvas
    const canvas = await html2canvas(tutorialCard, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff" // biar hasilnya berwarna putih
    });

    // Konversi canvas ke gambar
    const imgData = canvas.toDataURL("image/png");

    // Buat dokumen PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 60; // margin kiri-kanan
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 30, 30, imgWidth, imgHeight);
    pdf.save(`tutorial_${tutorialId}.pdf`);

    console.log(`✅ PDF tutorial_${tutorialId}.pdf berhasil dibuat`);
  } catch (err) {
    console.error("❌ Gagal generate PDF:", err);
    alert("❌ Gagal membuat PDF. Pastikan koneksi internet aktif untuk memuat library jsPDF & html2canvas.");
  }
}




window.previewTutorial = (id) => {
    window.open(`/tutorial/${id}`, "_blank");
};

window.shareTutorial = (id) => {
    const link = `${window.location.origin}/tutorial/${id}`;
    navigator.clipboard.writeText(link);
    alert("🔗 Link disalin ke clipboard:\n" + link);
};

window.deleteTutorial = async (id) => {
    if (!confirm("Yakin ingin menghapus tutorial ini?")) return;
    try {
        const res = await fetch(`/tutorials/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            alert("✅ Tutorial dihapus!");
            // 🔁 Refresh daftar tanpa reload halaman penuh
            if (window.loadTutorials) window.loadTutorials();
            // Tutup popup kalau kebetulan terbuka
            document.getElementById("tutorialEditor").style.display = "none";
        } else {
            alert("❌ " + (data.error || "Gagal menghapus"));
        }
    } catch (err) {
        alert("❌ " + err.message);
    }
};

