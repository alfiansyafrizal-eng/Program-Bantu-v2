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

// ===== MENU GENERATE LOGIC =====
const pad = n => String(n).padStart(2, '0');
const md5 = s => CryptoJS.MD5(s).toString();