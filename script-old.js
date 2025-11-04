/* Hidden textarea for copying URL (so URL not displayed visually) 
  <textarea aria-hidden="true" class="hidden-textarea" id="hiddenCopy"></textarea>
  <!-- === [1] jQuery dan Bootstrap dasar === -->
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <!-- === [2] Bootstrap Datepicker === -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.10.0/js/bootstrap-datepicker.min.js"></script>

  <!-- === [3] CryptoJS (HARUS setelah semua dependensi umum, sebelum script kamu) === -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>

  <!-- === [4] Firebase === -->
  <script src="https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/11.0.1/firebase-database-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/11.0.1/firebase-auth-compat.js"></script>

  <script src="assets/js/otp-generator.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
*/
    
    function getCookie(name) {
      let nameEQ = name + "=";
      let ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }

    function eraseCookie(name) {
      document.cookie = name + '=; Max-Age=-99999999;';
    }

    /************ CONFIG - FIREBASE ************/
    const firebaseConfig = {
      apiKey: "AIzaSyAK6Su582mWZ7o-2dU4Upoyc6YPAKJy4IQ",
      authDomain: "project1-ed479.firebaseapp.com",
      databaseURL: "https://project1-ed479-default-rtdb.firebaseio.com",
      projectId: "project1-ed479",
      storageBucket: "project1-ed479.firebasestorage.app",
      messagingSenderId: "779785198509",
      appId: "1:779785198509:web:2514cab2559d5d2bbf5f24"
    };

    const CONFIG = {
      kodeBranch: "UZ01",
      baseURL: "http://10.234.152.167/helpdesk/public/index/index",
      salt1: "alfamartku",
      salt2: "helpdeskonline12345678"
    };
    /******************************************************************/

    // Inisialisasi Firebase
    //firebase.initializeApp(firebaseConfig);
    //const db = firebase.database();
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.database();

    firebase.auth().signOut();

    // Elemen
    const kodeTokoEl = document.getElementById('kodeToko');
    const nikEl = document.getElementById('nik');
    const btnExecute = document.getElementById('btnExecute');
    const btnCopyUrl = document.getElementById('btnCopyUrl');
    const statusBadge = document.getElementById('statusBadge');
    const executeSpinner = document.getElementById('executeSpinner');
    const hiddenCopy = document.getElementById('hiddenCopy');

    // SNG elements
    const sngKodeTokoEl = document.getElementById('sngKodeToko');
    const sngAppEl = document.getElementById('sngApp');
    const sngMacEl = document.getElementById('sngMac');
    const btnGenerateSng = document.getElementById('btnGenerateSng');
    const btnCopySng = document.getElementById('btnCopySng');
    const btnCopyRegpwd = document.getElementById('btnCopyRegpwd');
    const sngResultEl = document.getElementById('sngResult');
    const sngStatus = document.getElementById('sngStatus');

    // Convert elements
    const inputBon = document.getElementById('inputBon');
    const outputBon = document.getElementById('outputBon');
    const btnCopyBon = document.getElementById('btnCopyBon');
    const btnClearBon = document.getElementById('btnClearBon');

    //Pass Cctv elements
    const cctvkodeToko = document.getElementById('cctvkodeToko')
    const userToko = document.getElementById('userToko')
    const passToko = document.getElementById('passToko')
    const passAdmin = document.getElementById('passAdmin')
    const btnCopyuserTokoCctv = document.getElementById('btnCopyuserTokoCctv')
    const btnCopypassTokoCctv = document.getElementById('btnCopypassTokoCctv')
    const btnCopypassAdminCctv = document.getElementById('btnCopypassAdminCctv')

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

    // Mapping konversi no bon
    const digitMap = {
      '0': 'M', '1': 'O', '2': 'Y', '3': 'D', '4': 'T',
      '5': 'U', '6': 'H', '7': 'C', '8': 'I', '9': 'K'
    };

    // ===== MENU GENERATE LOGIC =====
    //const pad = n => String(n).padStart(2, '0');
    //const md5 = s => CryptoJS.MD5(s).toString();

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
        statusBadge.innerHTML = `<span class="badge badge-ready">Ready</span>`;
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

    sngKodeTokoEl.addEventListener('input', () => {
      sngKodeTokoEl.value = sngKodeTokoEl.value.toUpperCase();
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
          btnExecute.style.display = 'none';
          btnCopyUrl.style.display = 'none';
          try {
            const nik = await getNomorAkhirByKodeToko(kode);
            nikEl.value = nik;
            // generate otomatis
            lastGeneratedUrl = generateHelpdeskURL(kode, nik);
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
          btnExecute.style.display = 'none';
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
        btnExecute.style.display = 'inline-block';
        btnCopyUrl.style.display = 'inline-block';
        setReadyState(true);
      } else {
        btnExecute.style.display = 'none';
        btnCopyUrl.style.display = 'none';
        setReadyState(false, '');
      }
    });

    btnExecute.addEventListener('click', () => {
      if (!lastGeneratedUrl) {
        alert('URL belum tersedia.');
        return;
      }

      executeSpinner.style.display = 'inline-block';

      // buka pertama kali di tab bernama "helpdeskTab"
      const newTab = window.open(lastGeneratedUrl, 'helpdeskTab');

      // jeda 2 detik lalu buka lagi di tab yang sama
      setTimeout(() => {
        newTab.location.href = lastGeneratedUrl;
      }, 800);

      // jeda 4 detik lalu buka terakhir di tab yang sama
      setTimeout(() => {
        newTab.location.href = lastGeneratedUrl;
        executeSpinner.style.display = 'none';
      }, 1600);
    });


    // Copy URL (hidden) supaya tidak ditampilkan tapi bisa paste ke Excel
    btnCopyUrl.addEventListener('click', () => {
      if (!lastGeneratedUrl) {
        alert('URL belum tersedia.');
        return;
      }
      copyToClipboard(lastGeneratedUrl);
      // feedback kecil
      btnCopyUrl.textContent = 'Copied ✓';
      setTimeout(() => { btnCopyUrl.textContent = 'Copy URL'; }, 1200);
    });

    // ===== MENU Convert No Bon Logic =====
    function convertLine(line) {
      return line.trim().split('').map(ch => digitMap[ch] || '').join('');
    }

    inputBon.addEventListener('input', () => {
      const lines = inputBon.value.split(/\r?\n/);
      const converted = lines.map(l => convertLine(l));
      outputBon.value = converted.join('\n');
    });

    btnCopyBon.addEventListener('click', () => {
      if (!outputBon.value) {
        alert('Tidak ada hasil untuk disalin.');
        return;
      }
      outputBon.select();
      document.execCommand('copy');
      // deselect
      window.getSelection().removeAllRanges();
      btnCopyBon.textContent = 'Copied ✓';
      setTimeout(() => { btnCopyBon.textContent = 'Copy Hasil'; }, 1200);
    });

    btnClearBon.addEventListener('click', () => {
      inputBon.value = '';
      outputBon.value = '';
    });

    // inisialisasi tampilan
    setReadyState(false, 'Siap');

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

    btnCopySng.addEventListener('click', () => {
      const val = sngResultEl.value;
      if (!val) {
        sngStatus.textContent = 'Tidak ada hasil untuk disalin.';
        return;
      }
      copyToClipboard(val);
      btnCopySng.textContent = '✓';
      setTimeout(() => { btnCopySng.textContent = 'Copy Hasil'; }, 1200);
    });

    btnCopyRegpwd.addEventListener('click', () => {
      const val = document.getElementById("regpwdResult").value;
      if (!val) {
        sngStatus.textContent = 'Tidak ada hasil untuk disalin.';
        return;
      }
      copyToClipboard(val);
      btnCopyRegpwd.textContent = 'Copied ✓';
      setTimeout(() => { btnCopyRegpwd.textContent = 'Copy Hasil'; }, 1200);
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
      btnCopyuserTokoCctv.textContent = 'Copied ✓';
      setTimeout(() => { btnCopyuserTokoCctv.textContent = 'Copy'; }, 1200);
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
      btnCopypassTokoCctv.textContent = 'Copied ✓';
      setTimeout(() => { btnCopypassTokoCctv.textContent = 'Copy'; }, 1200);
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
      btnCopypassAdminCctv.textContent = 'Copied ✓';
      setTimeout(() => { btnCopypassAdminCctv.textContent = 'Copy'; }, 1200);
    });


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
      btnCopySsid1.textContent = 'Copied ✓';
      setTimeout(() => { btnCopySsid1.textContent = 'Copy'; }, 1200);
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
      btnCopyPass1.textContent = 'Copied ✓';
      setTimeout(() => { btnCopyPass1.textContent = 'Copy'; }, 1200);
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
      btnCopySsid2.textContent = 'Copied ✓';
      setTimeout(() => { btnCopySsid2.textContent = 'Copy'; }, 1200);
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
      btnCopyPass2.textContent = 'Copied ✓';
      setTimeout(() => { btnCopyPass2.textContent = 'Copy'; }, 1200);
    });

    function scrollTabs(amount) {
      const container = document.querySelector('.tab-container');
      container.scrollBy({ left: amount, behavior: 'smooth' });
    }

    // ===== MENU OTP LOGIC =====
    $(document).ready(function () {
      // === [1] Inisialisasi datepicker ===
      function initDatepicker() {
        $('.datepicker-otp').datepicker({
          format: 'dd-mm-yyyy',
          autoclose: true,
          todayHighlight: true,
          clearBtn: true,
          orientation: 'bottom auto'
        }).on('changeDate', function (e) {
          const date = e.date;
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yy = String(date.getFullYear()).slice(-2);
          const yyyy = String(date.getFullYear());
          $(this).attr('data-year',`${yyyy}${mm}${dd}`);
          $(this).attr('data-value', `${dd}${mm}${yy}`);
          $(this).attr('data-value2', `${yyyy}/${mm}/${dd}`);
        });
      }
      initDatepicker();
      $('a[data-bs-toggle="tab"]').on('shown.bs.tab', initDatepicker);

      // === [2] Fungsi tampil/sembunyi form sesuai jenis OTP ===
      $('#otpType').on('change', function () {
        const val = $(this).val();
        $('#UnlockFinger, #AdjustPartial, #HapusJadwalGrand, #AdjustGrand, #HapusTagSo, #TambahEdit').hide(); // sembunyikan semua dulu
        if (val === 'unlock_finger') $('#UnlockFinger').show();
        if (val === 'adjust_so_partial') $('#AdjustPartial').show();
        if (val === 'hapus_so_grand') $('#HapusJadwalGrand').show();
        if (val === 'adjust_so_grand') $('#AdjustGrand').show();
        if (val === 'hapus_tag_so') $('#HapusTagSo').show();
        if (val === 'tambah_edit') $('#TambahEdit').show();
      });

      // Fungsi utama untuk copy/download QRCode otomatis
      async function smartCopyOrDownloadQR(value, btnId, filename = 'qrcode.png') {
        const btn = document.getElementById(btnId);
        if (!value) return alert('Data QR kosong.');

          // Deteksi mobile vs desktop
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

          // 🔹 Buat div tersembunyi untuk QR sementara
          const tempDiv = document.createElement('div');
          tempDiv.style.visibility = 'hidden';
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          document.body.appendChild(tempDiv);

          // 🔹 Generate QR di canvas
          const qrcode = new QRCode(tempDiv, {
            text: value.trim(),
            width: 400,
            height: 400,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });

          // Tunggu QR selesai dibuat
          await new Promise(r => setTimeout(r, 300));

          const canvas = tempDiv.querySelector('canvas');
          if (!canvas) {
            tempDiv.remove();
            return alert('Gagal membuat QR.');
          }

          // 🔹 Tambahkan margin putih besar (quiet zone) agar terbaca scanner fisik
          const margin = 60;
          const newCanvas = document.createElement('canvas');
          const newCtx = newCanvas.getContext('2d');
          newCanvas.width = canvas.width + margin * 2;
          newCanvas.height = canvas.height + margin * 2;

          newCtx.fillStyle = "#ffffff";
          newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
          newCtx.drawImage(canvas, margin, margin);

          const dataUrl = newCanvas.toDataURL('image/png');
          tempDiv.remove();

          // 🔹 Jalankan sesuai perangkat
          if (isMobile) {
            // 📱 MOBILE → Download QR
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();

            btn.textContent = 'Downloaded ✓';
            setTimeout(() => btn.textContent = 'QR', 1200);

          } else {
            // 💻 DESKTOP → Copy QR ke clipboard
          try {
            const blob = await (await fetch(dataUrl)).blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            btn.textContent = 'Copied ✓';
            setTimeout(() => btn.textContent = 'QR', 1200);
          } catch (err) {
            // fallback jika browser tidak support copy image
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
            btn.textContent = 'Downloaded ✓';
            setTimeout(() => btn.textContent = 'QR', 1200);
          }
        }
      }

      // === [3] Fungsi utama generate OTP ===
      function generateOTP(type) {
        let kodeToko, tanggal, nik, rawString, rawString1, rawString2, referensi;

        if (type === 'unlock_finger') {
          kodeToko = $('#KdTokoFinger input').val().trim().toUpperCase();
          tanggal = $('#TanggalFinger input').attr('data-value');
          if (!kodeToko || !tanggal) return alert('Isi Kode Toko dan pilih tanggal terlebih dahulu!');
          rawString = `f4ngert1s${kodeToko}${tanggal}g4nthak1ki`;
        }

        if (type === 'adjust_so_partial') {
          kodeToko = $('#kdTokoPartial input').val().trim().toUpperCase();
          tanggal = $('#TanggalPartial input').attr('data-value');
          nik = $('#NikPartial input').val().trim();
          if (!kodeToko || !tanggal || !nik) return alert('Lengkapi semua kolom (Kode Toko, Tanggal, dan NIK).');
          rawString = `SO-p4rt${tanggal}${kodeToko}${nik}`;
        }

        if (type === 'adjust_so_grand'){
          kodeToko = $('#kdTokoAdjustGrand input').val().trim().toUpperCase();
          referensi = $('#ReferensiAdjustGrand input').val().trim();
          totalRupiah = $('#TotalAdjustGrand input').val().trim();
          if (!kodeToko || !referensi || !totalRupiah) return alert('Lengkapi semua kolom (Kode Toko, referensi, dan total rupiah).');
          rawString = `SOgr4nd${kodeToko}${referensi}${totalRupiah}`;
        }

        if (type === 'hapus_so_grand'){
          kodeToko = $('#kdTokoJadwalGrand input').val().trim().toUpperCase();
          tanggal = $('#TanggalJadwalGrand input').attr('data-year');
          if (!kodeToko || !tanggal) return alert('Lengkapi semua kolom (Kode Toko, Tanggal, dan NIK).');
          rawString = `${kodeToko}HAPUSSOGRAND${tanggal}`;
        }

        if (type === 'hapus_tag_so'){
          kodeToko = $('#kdTokoHapusTagSo input').val().trim().toUpperCase();
          tanggal = $('#TanggalHapusTagSo input').attr('data-value2');
          if (!kodeToko || !tanggal) return alert('Lengkapi semua kolom (Kode Toko, Tanggal).');
          rawString1 = `${tanggal}|HAPUSTAGAJA|${kodeToko}`;
          rawString2 = `${tanggal}|HAPUSSOAJA|${kodeToko}`;
        }

        if (type === 'tambah_edit'){
          kodeToko = $('#kdTokoTambahEdit input').val().trim().toUpperCase();
          tanggal = $('#TanggalTambahEdit input').attr('data-value2');
          referensi = $('#ReferensiTambahEdit input').val().trim();
          if (!kodeToko || !referensi || !tanggal) return alert('Lengkapi semua kolom (Kode Toko, Tanggal, Referensi).');
          rawString = `${referensi}x@xrYPpx`;
        }

        // hash dan ambil 8 digit numerik pertama
        const hash = md5(rawString).toUpperCase();
        const hash2 = md5(rawString);
        const hashTag = md5(rawString1);
        const hashSo = md5(rawString2);
        const angka = hash.replace(/\D/g, '').slice(0, 8);
        if (angka.length < 8) return alert('Hash tidak menghasilkan cukup angka.');

        if (type === 'unlock_finger') {
          $('#ResultFinger').val(angka);
          simpanRiwayatOTP(type, kodeToko, tanggal, angka);
        }

        if (type === 'adjust_so_partial') {
          $('#ResultPartial').val(angka);
          simpanRiwayatOTP(type, kodeToko, tanggal, angka);
        }

        if (type === 'adjust_so_grand') {
          $('#ResultAdjustGrand').val(angka);
          simpanRiwayatOTP(type, kodeToko, tanggal, angka);
        }

        if (type === 'hapus_so_grand') {
          $('#ResultJadwalGrand').val(hash2);
          $('#CopyQrGrand').off('click').on('click', function () {
            smartCopyOrDownloadQR(hash2, 'CopyQrGrand', `hapus_Jadwal_Grand_${tanggal}.png`);
          });
          simpanRiwayatOTP(type, kodeToko, tanggal, hash2);
        }

        if (type === 'hapus_tag_so') {
          $('#ResultHapusTag').val(hashTag); 
          $('#ResultHapusSo').val(hashSo);
          $('#CopyQrTag').off('click').on('click', function () {
            smartCopyOrDownloadQR(hashTag, 'CopyQrTag', `hapus_tag_${tanggal}.png`);
          });
          $('#CopyQrSo').off('click').on('click', function () {
            smartCopyOrDownloadQR(hashSo, 'CopyQrSo', `hapus_so_${tanggal}.png`);
          });
          simpanRiwayatOTP(type, kodeToko, tanggal, `${hashTag}|${hashSo}`);
        }

        if (type === 'tambah_edit') {
          $('#ResultTambahEdit').val(hash2); 
          $('#CopyQrTambahEdit').off('click').on('click', function () {
            smartCopyOrDownloadQR(hash2, 'CopyQrTambahEdit', `tambah_edit_${tanggal}.png`);
          });
          simpanRiwayatOTP(type, kodeToko, tanggal, hash2, referensi);
        }

      }

      // === [A] Simpan user login aktif dari Firebase Auth ===
      let currentNik = null;

      auth.onAuthStateChanged((user) => {
        if (user) {
          currentNik = user.email.split('@')[0];
          //console.log("✅ User login:", currentNik);
        } else {
         //console.warn("⚠️ Tidak ada user login aktif.");
         currentNik = null;
        }
      });

      // === [B] Tambahkan fungsi untuk simpan riwayat OTP ===
      async function simpanRiwayatOTP(type, kodeToko, tanggal, hasilOTP, referensi) {
        if (!currentNik) {
          //console.warn("❌ Tidak bisa simpan OTP — belum login Firebase.");
          return;
        }

        try {
          const waktu = new Date();
          const timestamp = waktu.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

          const otpData = {
            jenis: type,
            kodeToko: kodeToko || '-',
            tanggal: tanggal || '-',
            referensi: referensi || '-',
            hasilOTP: hasilOTP || '-',
            dibuatOleh: currentNik,
            timestamp: timestamp
          };

          await db.ref(`otp_history/${currentNik}`).push(otpData);
          //console.log("✅ Riwayat OTP tersimpan di Firebase:", otpData);
        } catch (err) {
          //console.error("❌ Gagal simpan riwayat OTP:", err);
        }
      }

      // === [4] Fungsi universal untuk tombol Copy ===
      function setupCopy(buttonId, inputId) {
        const btn = document.getElementById(buttonId);
        const inp = document.getElementById(inputId);
        if (!btn || !inp) return;

        btn.addEventListener('click', () => {
          if (!inp.value) {
            alert('Tidak ada hasil untuk disalin.');
            return;
          }
          inp.select();
          document.execCommand('copy');
          window.getSelection().removeAllRanges();
          btn.textContent = 'Copied ✓';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
        });
      }

      // === [5] Bind tombol Execute & Copy ===
      $('#btnFinger button').on('click', () => generateOTP('unlock_finger'));
      $('#btnPartial button').on('click', () => generateOTP('adjust_so_partial'));
      $('#btnJadwalGrand button').on('click',() => generateOTP('hapus_so_grand'));
      $('#btnHapusTagSo button').on('click',() => generateOTP('hapus_tag_so'));
      $('#btnTambahEdit button').on('click',() => generateOTP('tambah_edit'));
      $('#btnAdjustGrand button').on('click',() => generateOTP('adjust_so_grand'));
      setupCopy('CopyFinger', 'ResultFinger');
      setupCopy('CopyPartial', 'ResultPartial');
      setupCopy('CopyAdjustGrand', 'ResultAdjustGrand');
      setupCopy('CopyJadwalGrand', 'ResultJadwalGrand');
      setupCopy('CopyHapusTag', 'ResultHapusTag');
      setupCopy('CopyHapusSo', 'ResultHapusSo');
      setupCopy('CopyTambahEdit', 'ResultTambahEdit');
    });

    // === UPDATE NIK MANUAL ===
    document.getElementById('btnUpdateNik').addEventListener('click', async () => {
      const kode = kodeTokoEl.value.trim().toUpperCase();
      const nik = nikEl.value.trim();
      if (!kode || !nik) {
        alert("Kode Toko dan NIK harus diisi");
        return;
      }
      try {
        await db.ref(`nomorAkhir/${kode}/nik`).set(nik);

        // tampilkan pesan sukses di statusBadge
        statusBadge.innerHTML = `<span class="badge badge-ready">Berhasil Disimpan ✓</span>`;
        setTimeout(() => {
          statusBadge.innerHTML = `<span class="badge badge-ready">Ready</span>`;
        }, 2000);

      } catch (err) {
        console.error(err);
        statusBadge.innerHTML = `<span class="small-muted">Gagal update NIK</span>`;
        setTimeout(() => {
          statusBadge.innerHTML = `<span class="badge badge-ready">Ready</span>`;
        }, 2000);

      }
    });

    // === UPLOAD FILE XLSX UNTUK UPDATE NIK ===
    // load SheetJS
    /*
    const scriptXLSX = document.createElement('script');
    scriptXLSX.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    document.head.appendChild(scriptXLSX);

    document.getElementById('fileUpload').addEventListener('change', handleFile, false);

    const uploadLoading = document.getElementById('uploadLoading');

    function handleFile(e) {
      const file = e.target.files[0];
      if (!file) return;

      uploadLoading.style.display = 'block'; // Tampilkan loading

      const reader = new FileReader();
      reader.onload = function (evt) {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        updateNikFromExcel(jsonData);
      };
      reader.readAsArrayBuffer(file);
    }

    async function updateNikFromExcel(data) {
      if (!Array.isArray(data) || data.length === 0) {
        alert("File kosong atau format salah");
        uploadLoading.style.display = 'none';
        return;
      }

      try {
        const updates = {}; // kumpulkan semua perubahan

        for (const row of data) {
          const kode = String(row.kode_toko || "").trim().toUpperCase();
          const nik = String(row.nik || "").trim();
          if (kode && nik) {
            updates[`nomorAkhir/${kode}/nik`] = nik;
          }
        }

        // 🔹 sekali update, jauh lebih cepat
        await db.ref().update(updates);

        alert("Update NIK dari Excel selesai");
      } catch (err) {
        console.error(err);
        alert("Gagal update NIK dari Excel");
      } finally {
        uploadLoading.style.display = 'none'; // sembunyikan loading
      }
    }
    */

    // Pastikan tombol Update NIK ikut toggle tampil/hide
    const btnUpdateNik = document.getElementById('btnUpdateNik');
    btnUpdateNik.style.display = 'none';

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
          btnExecute.style.display = 'none';
          btnCopyUrl.style.display = 'none';
          btnUpdateNik.style.display = 'none';
          try {
            const nik = await getNomorAkhirByKodeToko(kode);
            nikEl.value = nik;
            lastGeneratedUrl = generateHelpdeskURL(kode, nik);
            btnExecute.style.display = 'inline-block';
            btnCopyUrl.style.display = 'inline-block';
            btnUpdateNik.style.display = 'inline-block';
            setReadyState(true);
          } catch (err) {
            setReadyState(false, err.message || 'Gagal ambil NIK');
            nikEl.value = '';
            lastGeneratedUrl = '';
          }
        } else {
          btnExecute.style.display = 'none';
          btnCopyUrl.style.display = 'none';
          btnUpdateNik.style.display = 'none';
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
        btnExecute.style.display = 'inline-block';
        btnCopyUrl.style.display = 'inline-block';
        btnUpdateNik.style.display = 'inline-block';
        setReadyState(true);
      } else {
        btnExecute.style.display = 'none';
        btnCopyUrl.style.display = 'none';
        btnUpdateNik.style.display = 'none';
        setReadyState(false, '');
      }
    });

    // 🔹 Elemen HTML
    const loginCard = document.getElementById('loginCard');
    const dashboard = document.getElementById('dashboard');
    const btnLogin = document.getElementById('btnLogin');
    const loginUser = document.getElementById('loginUser');
    const loginPassword = document.getElementById('loginPassword');
    const loginStatus = document.getElementById('loginStatus');
    const loading = document.getElementById('loading');
    const userInfo = document.getElementById('userInfo');
    const btnLogout = document.getElementById('btnLogout');
    const menuOtp = document.getElementById('tab-otp');

    // Awal: sembunyikan dashboard
    dashboard.style.display = "none";

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
        loginStatus.textContent = "Login gagal: " + err.message;
        loading.style.display = "none";
        btnLogin.disabled = false;
      }
    });

    async function showDashboard(user) {
      loginCard.style.display = "none";
      dashboard.style.display = "block";

      const nik = user.email.split("@")[0];
      userInfo.textContent = `Login sebagai: ${nik}`;

      // 🔹 Sembunyikan dulu menu OTP
      menuOtp.style.display = "none";

      try {
        const dbRef = db.ref("allowedOtpUsers/" + nik);
        const snapshot = await dbRef.get();
        if (snapshot.exists() && snapshot.val() === true) {
          menuOtp.style.display = "inline-block";
        } else {
          menuOtp.style.display = "none";
        }
      } catch (err) {
        console.error("Gagal cek izin OTP:", err);
        menuOtp.style.display = "none";
      }

      loading.style.display = "none";
      btnLogin.disabled = false;
    }

    // 🔹 Event logout
    btnLogout.addEventListener("click", async () => {
      await auth.signOut();
      dashboard.style.display = "none";
      loginCard.style.display = "block";
    });
    

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
      dashboard.style.display = "none";
      loading.style.display = "none";
      btnLogin.disabled = false;
      document.getElementById("loginUser").value = "";
      document.getElementById("loginPassword").value = "";
    }
