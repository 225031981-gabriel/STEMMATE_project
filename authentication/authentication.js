const pinInput = document.getElementById("pinInput");

const createPinButton =
    document.getElementById("createPinButton");

const signInButton =
    document.getElementById("signInButton");

const signOutButton =
    document.getElementById("signOutButton");

const saveButton =
    document.getElementById("saveButton");

const loginSection =
    document.getElementById("loginSection");

const dashboard =
    document.getElementById("dashboard");

const message =
    document.getElementById("message");

const workInput =
    document.getElementById("workInput");


// DATABASE SETUP

const databaseName = "STEMMatePack5Prototype";

let databasePromise = null;

let activeKey = null;


// OPEN DATABASE

function openDatabase() {

    if (databasePromise) {
        return databasePromise;
    }

    databasePromise = new Promise((resolve, reject) => {

        const request = indexedDB.open(databaseName, 1);

        request.onupgradeneeded = function(event) {

            const database = event.target.result;

            database.createObjectStore("security");

        };

        request.onsuccess = function(event) {

            resolve(event.target.result);

        };

        request.onerror = function() {

            reject(request.error);

        };

    });

    return databasePromise;
}


// SAVE ENCRYPTED DATA

async function saveEncryptedData(data) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            database.transaction("security", "readwrite");

        const store = transaction.objectStore("security");

        store.put(data, "userVault");

        transaction.oncomplete = resolve;

        transaction.onerror = function() {
            reject(transaction.error);
        };

    });

}


// GET ENCRYPTED DATA

async function getEncryptedData() {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            database.transaction("security", "readonly");

        const store = transaction.objectStore("security");

        const request = store.get("userVault");

        request.onsuccess = function() {

            resolve(request.result);

        };

        request.onerror = function() {

            reject(request.error);

        };

    });

}


// GENERATE ENCRYPTION KEY

async function generateKey(pin, salt) {

    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(pin),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 310000,
            hash: "SHA-256"
        },
        keyMaterial,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );

}


// ENCRYPT SAVED WORK

async function encryptWork(work, key) {

    const encoder = new TextEncoder();

    const iv = crypto.getRandomValues(
        new Uint8Array(12)
    );

    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encoder.encode(work)
    );

    return {
        iv: Array.from(iv),
        encrypted: Array.from(new Uint8Array(encrypted))
    };

}


// DECRYPT SAVED WORK

async function decryptWork(data, key) {

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(data.iv)
        },
        key,
        new Uint8Array(data.encrypted)
    );

    return new TextDecoder().decode(decrypted);

}


// NUMBER 4: CREATE PIN

async function createPIN() {

    try {

        const pin = pinInput.value;

        if (!/^\d{6,8}$/.test(pin)) {

            message.textContent =
                "Please enter a PIN containing 6 to 8 digits.";

            return;

        }

        const existingVault = await getEncryptedData();

        if (existingVault) {

            message.textContent =
                "A PIN has already been created.";

            return;

        }

        const salt = crypto.getRandomValues(
            new Uint8Array(16)
        );

        const key = await generateKey(pin, salt);

        const encryptedWork = await encryptWork("", key);

        await saveEncryptedData({

            salt: Array.from(salt),

            iv: encryptedWork.iv,

            encrypted: encryptedWork.encrypted

        });

        activeKey = key;

        pinInput.value = "";

        showDashboard("");

        message.textContent = "PIN created successfully.";

    } catch (error) {

        message.textContent =
            "Unable to create PIN. Please try again.";

        console.error(error);

    }

}


// NUMBER 5: SIGN IN

async function signIn() {

    try {

        const pin = pinInput.value;

        if (!/^\d{6,8}$/.test(pin)) {

            message.textContent =
                "Enter your 6 to 8 digit PIN.";

            return;

        }

        const savedData = await getEncryptedData();

        if (!savedData) {

            message.textContent =
                "Please create a PIN first.";

            return;

        }

        const salt = new Uint8Array(savedData.salt);

        const key = await generateKey(pin, salt);

        const work = await decryptWork(savedData, key);

        activeKey = key;

        pinInput.value = "";

        showDashboard(work);

    } catch (error) {

        activeKey = null;

        message.textContent =
            "Incorrect PIN. Please try again.";

        console.error(error);

    }

}


// SHOW DASHBOARD

function showDashboard(work) {

    loginSection.hidden = true;

    dashboard.hidden = false;

    workInput.value = work;

}


// NUMBER 6: SAVE WORK

async function saveWork() {

    try {

        if (!activeKey) {

            message.textContent =
                "Please sign in first.";

            return;

        }

        const encryptedWork = await encryptWork(
            workInput.value,
            activeKey
        );

        const savedData = await getEncryptedData();

        await saveEncryptedData({

            salt: savedData.salt,

            iv: encryptedWork.iv,

            encrypted: encryptedWork.encrypted

        });

        message.textContent = "Work saved securely.";

    } catch (error) {

        message.textContent =
            "Unable to save your work.";

        console.error(error);

    }

}


// NUMBER 7: SIGN OUT

function signOut() {

    activeKey = null;

    workInput.value = "";

    dashboard.hidden = true;

    loginSection.hidden = false;

    pinInput.value = "";

    message.textContent =
        "You have signed out successfully.";

}


// BUTTON EVENTS

createPinButton.addEventListener(
    "click",
    createPIN
);

signInButton.addEventListener(
    "click",
    signIn
);

saveButton.addEventListener(
    "click",
    saveWork
);

signOutButton.addEventListener(
    "click",
    signOut
);