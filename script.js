// === HANDLE MENU NAVIGATION ===
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const target = item.dataset.target;
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
      if (sec.id === 'content-' + target) sec.classList.add('active');
    });
  });
});

// === Responsif sidebar di mobile ===
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.querySelector(".toggle-sidebar-btn");
  const dashboardContent = document.querySelector(".dashboard-content");
  const topPanel = document.querySelector(".top-panel");

  if (window.innerWidth <= 1024) {
    sidebar.classList.remove("active");
    dashboardContent.classList.remove("sidebar-active");
    topPanel.classList.remove("sidebar-active");
  }

  toggleBtn.addEventListener("click", () => {
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle("active");
    } else {
      sidebar.classList.toggle("collapsed");
    }
  });

  // ✅ Auto-close sidebar saat klik area luar
  document.addEventListener("click", (event) => {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.querySelector(".toggle-sidebar-btn");

    // Jika mobile dan sidebar aktif
    if (window.innerWidth <= 1024 && sidebar.classList.contains("active")) {

      // Jika klik bukan di sidebar dan bukan di tombol toggle
      if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
        sidebar.classList.remove("active");
      }
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove("active");
      dashboardContent.classList.remove("sidebar-active");
      topPanel.classList.remove("sidebar-active");
    }
  });
});

/*===TAMPIL MENU OTP===
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
*/

  
  const btnQuery = document.getElementById('btnOpenQuery');
  const queryPanel = document.getElementById('queryPanel');
  const queryContent = document.getElementById('content-query');
  const closeQuery = document.getElementById('closeQueryPanel');

  btnQuery.addEventListener('click', () => {
    queryPanel.classList.toggle('active');
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    queryContent.classList.add('active');
  });

  closeQuery.addEventListener('click', () => {
    queryPanel.classList.remove('active');
  });

