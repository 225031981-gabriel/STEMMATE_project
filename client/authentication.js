const pinInput = document.getElementById("pinInput");
const createPinButton = document.getElementById("createPinButton");
const signInButton = document.getElementById("signInButton");
const message = document.getElementById("message");

const databaseName = "STEMMatePack5Prototype";
let databasePromise = null;
let activeKey = null; 

function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);
        request.onupgradeneeded = function(event) {
            event.target.result.createObjectStore("security");
        };
        request.onsuccess = function(event) { resolve(event.target.result); };
        request.onerror = function() { reject(request.error); };
    });
    return databasePromise;
}

async function saveEncryptedData(data) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction("security", "readwrite");
        transaction.objectStore("security").put(data, "userVault");
        transaction.oncomplete = resolve;
        transaction.onerror = function() { reject(transaction.error); };
    });
}

async function getEncryptedData() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction("security", "readonly");
        const request = transaction.objectStore("security").get("userVault");
        request.onsuccess = function() { resolve(request.result); };
        request.onerror = function() { reject(request.error); };
    });
}

async function generateKey(pin, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", encoder.encode(pin), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: 310000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptWork(work, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, key, encoder.encode(work)
    );
    return { iv: Array.from(iv), encrypted: Array.from(new Uint8Array(encrypted)) };
}

async function decryptWork(data, key) {
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(data.iv) },
        key, new Uint8Array(data.encrypted)
    );
    return new TextDecoder().decode(decrypted);
}

async function createPIN() {
    try {
        const pin = pinInput.value;
        if (!/^\d{6,8}$/.test(pin)) {
            message.textContent = "Please enter a PIN containing 6 to 8 digits.";
            return;
        }
        const existingVault = await getEncryptedData();
        if (existingVault) {
            message.textContent = "A PIN has already been created.";
            return;
        }
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await generateKey(pin, salt);
        const encryptedWork = await encryptWork("", key);
        
        await saveEncryptedData({
            salt: Array.from(salt),
            iv: encryptedWork.iv,
            encrypted: encryptedWork.encrypted
        });
        
        activeKey = key;
        pinInput.value = "";
        message.textContent = "PIN created successfully.";
        document.getElementById('screen-signin').hidden = true;
        document.getElementById('screen-plan').hidden = false; 
        document.getElementById('plan-heading').focus();
    } catch (error) {
        message.textContent = "Unable to create PIN. Please try again.";
    }
}

async function signIn() {
    try {
        const pin = pinInput.value;
        if (!/^\d{6,8}$/.test(pin)) {
            message.textContent = "Enter your 6 to 8 digit PIN.";
            return;
        }
        const savedData = await getEncryptedData();
        if (!savedData) {
            message.textContent = "Please create a PIN first.";
            return;
        }
        const salt = new Uint8Array(savedData.salt);
        const key = await generateKey(pin, salt);
        await decryptWork(savedData, key);
        
        activeKey = key;
        pinInput.value = "";
        message.textContent = "";
        document.getElementById('screen-signin').hidden = true;
        document.getElementById('screen-plan').hidden = false; 
        document.getElementById('plan-heading').focus();
    } catch (error) {
        activeKey = null;
        message.textContent = "Incorrect PIN. Please try again.";
    }
}

function signOut() {
    activeKey = null;
    pinInput.value = "";
    document.getElementById('screen-plan').hidden = true;
    document.getElementById('screen-signin').hidden = false;
    message.textContent = "You have signed out successfully.";
    document.getElementById('pinInput').focus();
}

createPinButton.addEventListener("click", createPIN);
signInButton.addEventListener("click", signIn);