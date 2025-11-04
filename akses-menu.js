// akses-menu.js — versi cepat dengan cache localStorage
document.addEventListener("DOMContentLoaded", async () => {
  const nik = localStorage.getItem("nik");
  if (!nik) {
    console.warn("Belum login, redirect ke login.html");
    window.location.href = "login.html";
    return;
  }

  const cacheKey = `permissions_${nik}`;
  const cached = localStorage.getItem(cacheKey);
  const allMenus = document.querySelectorAll(".menu-item");

  // Default: sembunyikan semua menu dulu (biar tidak flicker)
  allMenus.forEach(el => {
    if (el.id !== "convertbon") el.style.display = "none";
  });

  // 🔹 Jika ada cache → tampilkan dulu menu berdasarkan cache
  if (cached) {
    try {
      const permissions = JSON.parse(cached);
      Object.entries(permissions).forEach(([menuId, allowed]) => {
        const menuEl = document.getElementById(menuId);
        if (!menuEl) return;
        if (allowed === true || allowed === "true") {
          menuEl.style.display = "flex";
        }
      });
      console.log("✅ Menu ditampilkan dari cache:", permissions);
    } catch (e) {
      console.warn("Cache izin rusak:", e);
    }
  }

  // 🔹 Kemudian ambil data terbaru dari Firebase (async, tidak blok UI)
  try {
    if (typeof db === "undefined") {
      console.error("Firebase belum siap!");
      return;
    }

    const permRef = db.ref("userPermissions/" + nik);
    const snap = await permRef.get();

    if (!snap.exists()) {
      console.warn("Tidak ada data izin untuk user:", nik);
      localStorage.removeItem(cacheKey);
      return;
    }

    const permissions = snap.val();
    console.log("🌐 Update izin dari Firebase:", permissions);

    // Simpan ke cache untuk load cepat berikutnya
    localStorage.setItem(cacheKey, JSON.stringify(permissions));

    // Update tampilan menu real-time
    Object.entries(permissions).forEach(([menuId, allowed]) => {
      const menuEl = document.getElementById(menuId);
      if (!menuEl) return;
      const isAllowed = (allowed === true || allowed === "true");
      menuEl.style.display = isAllowed ? "flex" : "none";
    });
  } catch (err) {
    console.error("❌ Gagal memeriksa izin menu:", err);
  }
});
