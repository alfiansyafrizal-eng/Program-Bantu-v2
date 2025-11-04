const cctvkodeToko = document.getElementById('cctvkodeToko')
const userToko = document.getElementById('userToko')
const passToko = document.getElementById('passToko')
const passAdmin = document.getElementById('passAdmin')
const btnCopyuserTokoCctv = document.getElementById('btnCopyuserTokoCctv')
const btnCopypassTokoCctv = document.getElementById('btnCopypassTokoCctv')
const btnCopypassAdminCctv = document.getElementById('btnCopypassAdminCctv')

// === MENU PASS CCTV LOGIC ===
async function getNomorAkhirData(kode) {
    const snap = await db.ref(`nomorAkhir/${kode}`).get();
    if (snap.exists()) return snap.val();
    throw new Error("Data tidak ditemukan");
}

cctvkodeToko.addEventListener("input", () => {
    const kode = cctvkodeToko.value.trim().toUpperCase();
    if (kode.length === 4) {
        getNomorAkhirData(kode)
            .then(data => {
                namaToko.value = data.nama_toko || "";
                userToko.value = data.user_toko || "";
                passToko.value = data.pass_toko || "";
                passAdmin.value = data.pass_admin || "";
            })
            .catch(err => {
                namaToko.value = "";
                userToko.value = "";
                passToko.value = "";
                passAdmin.value = "";
                alert(err.message);
            });
    }
});

btnCopyuserTokoCctv.addEventListener('click', () => {
    if (!userToko.value) {
        alert('Tidak ada hasil untuk disalin.');
        return;
    }
    userToko.select();
    document.execCommand('copy');
    // deselect
    window.getSelection().removeAllRanges();
    btnCopyuserTokoCctv.innerHTML = '✓';
    setTimeout(() => { btnCopyuserTokoCctv.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

btnCopypassTokoCctv.addEventListener('click', () => {
    if (!passToko.value) {
        alert('Tidak ada hasil untuk disalin.');
        return;
    }
    passToko.select();
    document.execCommand('copy');
    // deselect
    window.getSelection().removeAllRanges();
    btnCopypassTokoCctv.innerHTML = '✓';
    setTimeout(() => { btnCopypassTokoCctv.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

btnCopypassAdminCctv.addEventListener('click', () => {
    if (!passAdmin.value) {
        alert('Tidak ada hasil untuk disalin.');
        return;
    }
    passAdmin.select();
    document.execCommand('copy');
    // deselect
    window.getSelection().removeAllRanges();
    btnCopypassAdminCctv.innerHTML = '✓';
    setTimeout(() => { btnCopypassAdminCctv.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});