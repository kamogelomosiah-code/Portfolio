const token1 = "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";
const token2 = "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";

function encrypt(text) {
  return Buffer.from(text.split('').reverse().join('')).toString('base64');
}

console.log("token1:", encrypt(token1));
console.log("token2:", encrypt(token2));
