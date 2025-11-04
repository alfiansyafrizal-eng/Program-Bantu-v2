// SNG elements
const sngKodeTokoEl = document.getElementById('sngKodeToko');
const sngAppEl = document.getElementById('sngApp');
const sngMacEl = document.getElementById('sngMac');
const btnGenerateSng = document.getElementById('btnGenerateSng');
const btnCopySng = document.getElementById('btnCopySng');
const btnCopyRegpwd = document.getElementById('btnCopyRegpwd');
const sngResultEl = document.getElementById('sngResult');
const sngStatus = document.getElementById('sngStatus');

// ===== MENU GENERATE LOGIC =====
//const pad = n => String(n).padStart(2, '0');
//const md5 = s => CryptoJS.MD5(s).toString();


// ===== MENU SNG Logic =====
function normalizeMac(mac) {
    if (!mac) return '';
    // remove separators and whitespace
    const cleaned = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    return cleaned;
}

// validate minimal mac length (we don't force exact 12 chars but prefer it)
function validateMac(cleaned) {
    return /^[A-F0-9]{12,}$/.test(cleaned); // allow >=12 hex chars
}

btnGenerateSng.addEventListener('click', () => {
    const kode = sngKodeTokoEl.value.trim().toUpperCase();
    const macRaw = sngMacEl.value.trim();
    const mac = normalizeMac(macRaw);
    const app = sngAppEl.value; // SIS atau POS

    // reset feedback
    sngStatus.textContent = '';

    if (!kode) {
        sngStatus.textContent = 'Isi Kode Toko.';
        sngResultEl.value = '';
        btnCopySng.style.display = 'none';
        btnCopyRegpwd.style.display = 'none';
        return;
    }
    if (!app) {
        sngStatus.textContent = 'Pilih Aplikasi.';
        sngResultEl.value = '';
        btnCopySng.style.display = 'none';
        btnCopyRegpwd.style.display = 'none';
        return;
    }
    if (!mac) {
        sngStatus.textContent = 'Isi MAC Address.';
        sngResultEl.value = '';
        btnCopySng.style.display = 'none';
        btnCopyRegpwd.style.display = 'none';
        return;
    }
    if (!validateMac(mac)) {
        sngStatus.textContent = 'MAC tidak valid (harus hex, minimal 12 char).';
        sngResultEl.value = '';
        btnCopySng.style.display = 'none';
        btnCopyRegpwd.style.display = 'none';
        return;
    }

    // tentukan suffix aplikasi
    const appSuffix = (app === "SIS") ? "SIS!" : "POS@";

    // build string <kode toko> + <aplikasi> + <MACAddress>
    const source = `${kode}${appSuffix}${mac}`;
    const hash = md5(source); // 32 char hex lowercase

    // ambil mulai karakter ke-5 (index 4) sepanjang 16
    const startIndex = 4;
    let result = '';
    if (hash.length >= startIndex + 16) {
        result = hash.substr(startIndex, 16).toUpperCase();
    } else {
        result = hash.substr(startIndex).toUpperCase();
    }

    sngResultEl.value = result;

    if (app === "SIS") {
        // Generate RegPwd
        const hasilReg = rumusMacAdd_js(macRaw);
        document.getElementById("regpwdResult").value = hasilReg;
        btnCopyRegpwd.style.display = 'inline-block';
    } else {
        // Kalau POS, kosongkan RegPwd
        document.getElementById("regpwdResult").value = "None";
        btnCopyRegpwd.style.display = 'none';
    }
    sngStatus.textContent = 'Sukses';
    btnCopySng.style.display = 'inline-block';
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => console.log("Copied ✓"))
        .catch(err => console.error("Copy gagal:", err));
}

btnCopySng.addEventListener('click', () => {
    const val = sngResultEl.value;
    if (!val) {
        sngStatus.textContent = 'Tidak ada hasil untuk disalin.';
        return;
    }
    copyToClipboard(val);
    btnCopySng.innerHTML = '✓';
    setTimeout(() => { btnCopySng.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

btnCopyRegpwd.addEventListener('click', () => {
    const val = document.getElementById("regpwdResult").value;
    if (!val) {
        sngStatus.textContent = 'Tidak ada hasil untuk disalin.';
        return;
    }
    copyToClipboard(val);
    btnCopyRegpwd.innerHTML = '✓';
    setTimeout(() => { btnCopyRegpwd.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

// optional: allow Enter key on MAC or Kode to trigger Generate when focus on MAC
sngMacEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnGenerateSng.click();
    }
});
sngKodeTokoEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        // move focus to mac field for convenience
        sngMacEl.focus();
    }
});

//Funsi untuk reg pwd
function vbVal(s) {
    s = (s ?? "").trim();
    let numStr = "";
    for (let c of s) {
        if (c >= "0" && c <= "9") numStr += c; else break;
    }
    return numStr ? parseInt(numStr, 10) : 0;
}

function rumusMacAdd_js(TxtPass) {
    let str1 = "";
    let str2 = (TxtPass || "").toUpperCase().trim();

    // 1) Huruf A-Z -> ASCII code; angka 0-9 -> tetap; karakter lain diabaikan
    for (let i = 0; i < str2.length; i++) {
        const ch = str2[i];
        const code = ch.charCodeAt(0);
        if (code >= 65 && code <= 90) {
            str1 += String(code);
        } else if (code >= 48 && code <= 57) {
            str1 += ch;
        }
    }

    // 2) Batas 16 digit
    if (str1.length > 16) str1 = str1.slice(0, 16);

    // 3) Emulasi cek VB: jika CStr(Val(str1)) berbentuk x.xE+nn (umumnya saat 16 digit), potong 14
    if (str1.length === 16) {
        str1 = str1.slice(0, 14);
    }

    // 4) Tambah konstanta
    const num2 = parseInt(str1 || "0", 10) + 1042005;
    const num2str = String(num2);

    // 5) Dua digit 65..90 -> huruf, selain itu ambil satu digit
    let out = "";
    let pos = 0;
    while (pos < num2str.length) {
        const sub = num2str.substr(pos, 2);
        const val2 = vbVal(sub);
        if (val2 >= 65 && val2 <= 90) {
            out += String.fromCharCode(val2);
            pos += 2;
        } else {
            out += num2str[pos];
            pos += 1;
        }
    }
    return out;
}