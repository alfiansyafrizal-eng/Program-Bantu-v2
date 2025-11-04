// Convert elements
const inputBon = document.getElementById('inputBon');
const outputBon = document.getElementById('outputBon');
const btnCopyBon = document.getElementById('btnCopyBon');
const btnClearBon = document.getElementById('btnClearBon');

// Mapping konversi no bon
const digitMap = {
    '0': 'M', '1': 'O', '2': 'Y', '3': 'D', '4': 'T',
    '5': 'U', '6': 'H', '7': 'C', '8': 'I', '9': 'K'
};

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
