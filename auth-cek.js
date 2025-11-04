// protect.js — mencegah buka dashboard tanpa login (localStorage version)
document.addEventListener("DOMContentLoaded", () => {
  const nik = localStorage.getItem("nik");

  if (!nik) {
    console.warn("Belum login, redirect ke login.html");
    window.location.href = "login.html";
  } else {
    const body = document.getElementById("dashbord");
    if (body) body.style.visibility = "visible";
    // Jangan ubah display dashboard!
    // Biarkan CSS layout tetap bekerja.
  }
});
