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
            $(this).attr('data-year', `${yyyy}${mm}${dd}`);
            $(this).attr('data-value', `${dd}${mm}${yy}`);
            $(this).attr('data-value2', `${yyyy}/${mm}/${dd}`);
        });
    }
    initDatepicker();
    $('a[data-bs-toggle="tab"]').on('shown.bs.tab', initDatepicker);

    // === [2] Fungsi tampil/sembunyi form sesuai jenis OTP ===
    $('#otptype').on('change', function () {
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

            btn.innerHTML = '✓';
            setTimeout(() => btn.innerHTML = '<i class="fa fa-qrcode"></i>', 1200);

        } else {
            // 💻 DESKTOP → Copy QR ke clipboard
            try {
                const blob = await (await fetch(dataUrl)).blob();
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                btn.innerHTML = '✓';
                setTimeout(() => btn.innerHTML = '<i class="fa fa-qrcode"></i>', 1200);
            } catch (err) {
                // fallback jika browser tidak support copy image
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.click();
                btn.textContent = '✓';
                setTimeout(() => btn.textContent = '<i class="fa fa-qrcode"></i>', 1200);
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

        if (type === 'adjust_so_grand') {
            kodeToko = $('#kdTokoAdjustGrand input').val().trim().toUpperCase();
            referensi = $('#ReferensiAdjustGrand input').val().trim();
            totalRupiah = $('#TotalAdjustGrand input').val().trim();
            if (!kodeToko || !referensi || !totalRupiah) return alert('Lengkapi semua kolom (Kode Toko, referensi, dan total rupiah).');
            rawString = `SOgr4nd${kodeToko}${referensi}${totalRupiah}`;
        }

        if (type === 'hapus_so_grand') {
            kodeToko = $('#kdTokoJadwalGrand input').val().trim().toUpperCase();
            tanggal = $('#TanggalJadwalGrand input').attr('data-year');
            if (!kodeToko || !tanggal) return alert('Lengkapi semua kolom (Kode Toko, Tanggal, dan NIK).');
            rawString = `${kodeToko}HAPUSSOGRAND${tanggal}`;
        }

        if (type === 'hapus_tag_so') {
            kodeToko = $('#kdTokoHapusTagSo input').val().trim().toUpperCase();
            tanggal = $('#TanggalHapusTagSo input').attr('data-value2');
            if (!kodeToko || !tanggal) return alert('Lengkapi semua kolom (Kode Toko, Tanggal).');
            rawString1 = `${tanggal}|HAPUSTAGAJA|${kodeToko}`;
            rawString2 = `${tanggal}|HAPUSSOAJA|${kodeToko}`;
        }

        if (type === 'tambah_edit') {
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
            btn.innerHTML = '✓';
            setTimeout(() => { btn.innerHTML = '<i class="fa fa-copy"></i>'; }, 1200);
        });
    }

    // === [5] Bind tombol Execute & Copy ===
    $('#btnFinger button').on('click', () => generateOTP('unlock_finger'));
    $('#btnPartial button').on('click', () => generateOTP('adjust_so_partial'));
    $('#btnJadwalGrand button').on('click', () => generateOTP('hapus_so_grand'));
    $('#btnHapusTagSo button').on('click', () => generateOTP('hapus_tag_so'));
    $('#btnTambahEdit button').on('click', () => generateOTP('tambah_edit'));
    $('#btnAdjustGrand button').on('click', () => generateOTP('adjust_so_grand'));
    setupCopy('CopyFinger', 'ResultFinger');
    setupCopy('CopyPartial', 'ResultPartial');
    setupCopy('CopyAdjustGrand', 'ResultAdjustGrand');
    setupCopy('CopyJadwalGrand', 'ResultJadwalGrand');
    setupCopy('CopyHapusTag', 'ResultHapusTag');
    setupCopy('CopyHapusSo', 'ResultHapusSo');
    setupCopy('CopyTambahEdit', 'ResultTambahEdit');
});