// 🔹 Event logout
const btnlogout = document.getElementById("btnLogout");
btnlogout?.addEventListener("click", () => {
    localStorage.removeItem("nik"); // hapus data user
    window.location.href = "login.html"; // kembali ke login
});