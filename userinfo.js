document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("userInfo");

  // ambil nik dari localStorage
  const nik = localStorage.getItem("nik");

  if (nik && userInfo) {
    userInfo.textContent = `Halo ${nik}`;
  } else if (userInfo) {
    userInfo.textContent = "Login sebagai: (tidak dikenal)";
  }
});
