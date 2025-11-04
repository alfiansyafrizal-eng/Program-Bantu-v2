// Elemen
const kodeTokoEl = document.getElementById('kodeToko');
const nikEl = document.getElementById('nik');
const btnExecute = document.getElementById('btnExecute');
const btnCopyUrl = document.getElementById('btnCopyUrl');
const statusBadge = document.getElementById('statusBadge');
const executeSpinner = document.getElementById('executeSpinner');
const hiddenCopy = document.getElementById('hiddenCopy');
const hasilgenerate = document.getElementById('hasilgenerate');

// state
let lastGeneratedUrl = "";

// Ambil nomorAkhir dari Firebase
async function getNomorAkhirByKodeToko(kodeToko) {
    try {
        const snap = await db.ref(`nomorAkhir/${kodeToko}/nik`).get();
        if (snap && snap.exists()) return snap.val();
        throw new Error('Data kosong untuk kode toko: ' + kodeToko);
    } catch (err) {
        throw err;
    }
}

function generateHelpdeskURL(kodeToko, nomorAkhir) {
    const { kodeBranch, baseURL, salt1, salt2 } = CONFIG;
    const random5Digit = Math.floor(10000 + Math.random() * 90000);
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const MM = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const tanggal = dd + MM + yy;
    const waktu = hh + mm + ss;
    const kombinasi = `${kodeBranch}${kodeToko}${random5Digit}${salt1}${tanggal}${waktu}${tanggal}${waktu}${salt2}${tanggal}${waktu}`;
    const md5Hex = md5(kombinasi);
    return `${baseURL}/KD_TOKO/${kodeToko}/KD_BRANCH/${kodeBranch}/r/${random5Digit}/c/${md5Hex}/e/${tanggal}/j/${waktu}/nk/${nomorAkhir}`;
}

function setReadyState(ready, message) {
    if (ready) {
        statusBadge.innerHTML = `<span class="badge badge-ready">Sukses</span>`;
    } else {
        statusBadge.innerHTML = `<span class="small-muted">${message || ''}</span>`;
    }
}

// copy tekst to clipboard via hidden textarea (so URL not shown)
function copyToClipboard(text) {
    hiddenCopy.value = text;
    hiddenCopy.select();
    document.execCommand('copy');
    // deselect
    window.getSelection().removeAllRanges();
}

// Auto uppercase kode toko
kodeTokoEl.addEventListener('input', () => {
    kodeTokoEl.value = kodeTokoEl.value.toUpperCase();
});

// Trigger otomatis saat kode toko sudah 4 karakter
let fetchTimeout = null;
kodeTokoEl.addEventListener('input', () => {
    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(async () => {
        const kode = kodeTokoEl.value.trim();
        if (kode.length === 4) {
            // mulai loading kecil di badge
            setReadyState(false, 'Mengambil NIK...');
            btnExecute.style.display = 'inline-block';
            btnCopyUrl.style.display = 'none';
            try {
                const nik = await getNomorAkhirByKodeToko(kode);
                console.log("NIK dari Firebase:", nik);
                nikEl.value = nik;
                // generate otomatis
                lastGeneratedUrl = generateHelpdeskURL(kode, nik);
                hasilgenerate.value = lastGeneratedUrl;
                btnExecute.style.display = 'inline-block';
                btnCopyUrl.style.display = 'inline-block';
                setReadyState(true);
            } catch (err) {
                setReadyState(false, err.message || 'Gagal ambil NIK');
                nikEl.value = '';
                lastGeneratedUrl = '';
            }
        } else {
            // kalau kurang dari 4, hide buttons
            btnExecute.style.display = 'inline-block';
            btnCopyUrl.style.display = 'none';
            setReadyState(false, '');
            lastGeneratedUrl = '';
        }
    }, 250); // debounce
});

// Ketika nik diubah manual -> langsung regenerate
nikEl.addEventListener('input', () => {
    const kode = kodeTokoEl.value.trim();
    const nik = nikEl.value.trim();
    if (kode && nik) {
        lastGeneratedUrl = generateHelpdeskURL(kode, nik);
        hasilgenerate.value = lastGeneratedUrl;
        btnExecute.style.display = 'inline-block';
        btnCopyUrl.style.display = 'inline-block';
        setReadyState(true);
    } else {
        btnExecute.style.display = 'inline-block';
        btnCopyUrl.style.display = 'none';
        setReadyState(false, '');
    }
});

btnExecute.addEventListener('click', () => {
    if (!lastGeneratedUrl) {
        alert('URL belum tersedia.');
        return;
    }

    //executeSpinner.style.display = 'inline-block';

    // buka pertama kali di tab bernama "helpdeskTab"
    const newTab = window.open(lastGeneratedUrl, 'helpdeskTab');

    // jeda 2 detik lalu buka lagi di tab yang sama
});


// Copy URL (hidden) supaya tidak ditampilkan tapi bisa paste ke Excel
btnCopyUrl.addEventListener('click', () => {
    if (!lastGeneratedUrl) {
        alert('URL belum tersedia.');
        return;
    }
    copyToClipboard(lastGeneratedUrl);
    // feedback kecil
    btnCopyUrl.innerHTML = '✓';
    setTimeout(() => { btnCopyUrl.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

// Pastikan tombol Update NIK ikut toggle tampil/hide
const btnUpdateNik = document.getElementById('btnUpdateNik');
//btnUpdateNik.style.display = 'none';

// Modifikasi event listener kodeToko
(function () {
    const originalKodeListener = kodeTokoEl._listenersInput || [];
    kodeTokoEl._listenersInput = originalKodeListener;
})();

kodeTokoEl.addEventListener('input', () => {
    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(async () => {
        const kode = kodeTokoEl.value.trim();
        if (kode.length === 4) {
            setReadyState(false, 'Mengambil NIK...');
            btnExecute.style.display = 'inline-block';
            btnCopyUrl.style.display = 'none';
            //btnUpdateNik.style.display = 'none';
            try {
                const nik = await getNomorAkhirByKodeToko(kode);
                nikEl.value = nik;
                lastGeneratedUrl = generateHelpdeskURL(kode, nik);
                hasilgenerate.value = lastGeneratedUrl;
                btnExecute.style.display = 'inline-block';
                btnCopyUrl.style.display = 'inline-block';
                //btnUpdateNik.style.display = 'inline-block';
                setReadyState(true);
            } catch (err) {
                setReadyState(false, err.message || 'Gagal ambil NIK');
                nikEl.value = '';
                lastGeneratedUrl = '';
            }
        } else {
            btnExecute.style.display = 'inline-block';
            btnCopyUrl.style.display = 'none';
            //btnUpdateNik.style.display = 'none';
            setReadyState(false, '');
            lastGeneratedUrl = '';
        }
    }, 250);
});

// Modifikasi listener NIK manual
nikEl.addEventListener('input', () => {
    const kode = kodeTokoEl.value.trim();
    const nik = nikEl.value.trim();
    if (kode && nik) {
        lastGeneratedUrl = generateHelpdeskURL(kode, nik);
        hasilgenerate.value = lastGeneratedUrl;
        btnExecute.style.display = 'inline-block';
        btnCopyUrl.style.display = 'inline-block';
        btnUpdateNik.style.display = 'inline-block';
        setReadyState(true);
    } else {
        btnExecute.style.display = 'inline-block';
        btnCopyUrl.style.display = 'none';
        btnUpdateNik.style.display = 'none';
        setReadyState(false, '');
    }
});

