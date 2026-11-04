function verifyPin(enteredPin) {
    const correctPinHash = btoa("1234");
    return btoa(enteredPin) === correctPinHash;
}

const wrongPinResult = verifyPin("7777");

console.assert(
    wrongPinResult === false,
    "Test Failed: Wrong PIN was accepted!"
);

if (wrongPinResult === false) {
    console.log("Test Passed: Wrong PIN successfully rejected.");
}