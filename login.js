// 🔹 Elemen HTML
const loginCard = document.getElementById('loginCard');
//const dashboard = document.getElementById('dashbord');
const btnLogin = document.getElementById('btnLogin');
const loginUser = document.getElementById('loginUser');
const loginPassword = document.getElementById('loginPassword');
const loginStatus = document.getElementById('loginStatus');
const loading = document.getElementById('loading');
const userInfo = document.getElementById('userInfo');
const menuOtp = document.getElementById('otp');
const tutorial = document.getElementById('tutorial');

// Awal: sembunyikan dashboard
//dashboard.style.display = "none";

// 🔹 Event login
btnLogin.addEventListener("click", async () => {
    const nik = loginUser.value.trim();
    const password = loginPassword.value.trim();

    if (!nik || !password) {
        loginStatus.textContent = "NIK dan password harus diisi.";
        return;
    }

    loginStatus.textContent = "";
    loading.style.display = "block";
    btnLogin.disabled = true;

    const email = `${nik}@alfamart.local`;

    try {
        // 🔸 Login Firebase Auth
        const userCred = await auth.signInWithEmailAndPassword(email, password);

        // ✅ Simpan status login di sessionStorage
        sessionStorage.setItem("isLoggedIn", "true");

        // Simpan riwayat login (non-blocking)
        db.ref("loginHistory").push({
            uid: userCred.user.uid,
            nik: nik,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });

        // Tampilkan dashboard setelah login berhasil
        showDashboard(userCred.user);

    } catch (err) {
        sessionStorage.removeItem("isLoggedIn"); // pastikan login gagal, status dihapus
        loginStatus.textContent = "Login gagal: " + err.message;
        loading.style.display = "none";
        btnLogin.disabled = false;
    }

});

async function showDashboard(user) {
    if (loginCard) loginCard.style.display = "none";
    const nik = user.email.split("@")[0];
    localStorage.setItem("nik", nik);

    //console.log("Login berhasil, redirect ditunda sementara untuk debugging...");
    //console.log("User data:", user);

    window.location.href = "dashbord.html"; // ← aktifkan kembali nanti

    // 🔹 Sembunyikan menu OTP dengan aman
    if (menuOtp) menuOtp.style.display = "none";

    try {
        const dbRef = db.ref("allowedOtpUsers/" + nik);
        const snapshot = await dbRef.get();
        if (snapshot.exists() && snapshot.val() === true) {
            if (menuOtp) menuOtp.style.display = "inline-block";
        } else {
            if (menuOtp) menuOtp.style.display = "none";
        }
    } catch (err) {
        console.error("Gagal cek izin OTP:", err);
        if (menuOtp) menuOtp.style.display = "none";
    }

    // 🔹 Pastikan elemen-elemen ini ada sebelum diubah
    if (loading) loading.style.display = "none";
    if (btnLogin) btnLogin.disabled = false;
}


// === CEK SESSION ===
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        showDashboard(user);
    } else {
        showLogin();
    }
});

function showLogin() {
    loginCard.style.display = "block";
    //dashboard.style.display = "none";
    loading.style.display = "none";
    btnLogin.disabled = false;
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPassword").value = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btnLogin");
    const btnText = document.getElementById("btnText");
    const btnSpinner = document.getElementById("btnSpinner");

    btnLogin.addEventListener("click", async () => {
        // tampilkan spinner
        btnLogin.disabled = true;

        // simulasi proses login (misalnya 2 detik)
        await new Promise(r => setTimeout(r, 2000));

        // selesai loading
        //btnSpinner.style.display = "none";
        btnText.textContent = "Login";
        btnLogin.disabled = false;

        // di sini bisa lanjutkan logika login firebase, dll
        alert("Login selesai!");
    });
});
