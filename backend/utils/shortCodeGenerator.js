export function shortCodeGenerator(){

const base62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

let shortCode = "";


for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * base62.length);
    shortCode += base62[randomIndex];
    }

    return shortCode
}

