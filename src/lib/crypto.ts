// Simple encryption for localStorage (not meant for highly sensitive data)
const SALT = 'kanban-app-';

export function encrypt(text: string): string {
  const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
  const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
  const applySalt = (code: number) => textToChars(SALT).reduce((a, b) => a ^ b, code);

  return text
    .split('')
    .map(textToChars)
    .map(applySalt)
    .map(byteHex)
    .join('');
}

export function decrypt(encoded: string): string {
  const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
  const applySalt = (code: number) => textToChars(SALT).reduce((a, b) => a ^ b, code);
  
  return encoded
    .match(/.{1,2}/g)!
    .map(hex => parseInt(hex, 16))
    .map(applySalt)
    .map(charCode => String.fromCharCode(charCode))
    .join('');
}