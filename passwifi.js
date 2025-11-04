//Pass Wifi elements
const wifiKodeToko = document.getElementById("wifiKodeToko");
const wifiNamaToko = document.getElementById("wifiNamaToko");
const ssid1 = document.getElementById("ssid1");
const pass1 = document.getElementById("pass1");
const ssid2 = document.getElementById("ssid2");
const pass2 = document.getElementById("pass2");
const btnCopySsid1 = document.getElementById("btnCopySsid1");
const btnCopyPass1 = document.getElementById("btnCopyPass1");
const btnCopySsid2 = document.getElementById("btnCopySsid2");
const btnCopyPass2 = document.getElementById("btnCopyPass2");

// ===== MENU PASS WIFI LOGIC =====
wifiKodeToko.addEventListener("input", () => {
    const kode = wifiKodeToko.value.trim().toUpperCase();
    if (kode.length === 4) {
        getNomorAkhirData(kode)
            .then(data => {
                wifiNamaToko.value = data.nama_toko || "";
                ssid1.value = data.ssid1 || "";
                pass1.value = data.pass1 || "";
                ssid2.value = data.ssid2 || "";
                pass2.value = data.pass2 || "";
            })
            .catch(err => {
                wifiNamaToko.value = "";
                ssid1.value = "";
                pass1.value = "";
                ssid2.value = "";
                pass2.value = "";
                alert(err.message);
            });
    }
});

btnCopySsid1.addEventListener('click', () => {
    if (!ssid1.value) {
        alert('Tidak ada hasil untuk disalin.');
        return;
    }
    ssid1.select();
    document.execCommand('copy');
    // deselect
    window.getSelection().removeAllRanges();
    btnCopySsid1.innerHTML = '✓';
    setTimeout(() => { btnCopySsid1.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

btnCopyPass1.addEventListener('click', () => {
    if (!pass1.value) {
        alert('Tidak ada hasil untuk disalin.');
        return;
    }
    pass1.select();
    document.execCommand('copy');
    // deselect
    window.getSelection().removeAllRanges();
    btnCopyPass1.innerHTML = '✓';
    setTimeout(() => { btnCopyPass1.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

btnCopySsid2.addEventListener('click', () => {
    if (!ssid2.value) {
        alert('Tidak ada hasil untuk disalin.');
        return;
    }
    ssid2.select();
    document.execCommand('copy');
    // deselect
    window.getSelection().removeAllRanges();
    btnCopySsid2.innerHTML = '✓';
    setTimeout(() => { btnCopySsid2.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

btnCopyPass2.addEventListener('click', () => {
    if (!pass2.value) {
        alert('Tidak ada hasil untuk disalin.');
        return;
    }
    pass2.select();
    document.execCommand('copy');
    // deselect
    window.getSelection().removeAllRanges();
    btnCopyPass2.innerHTML = '✓';
    setTimeout(() => { btnCopyPass2.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
});

function scrollTabs(amount) {
    const container = document.querySelector('.tab-container');
    container.scrollBy({ left: amount, behavior: 'smooth' });
}