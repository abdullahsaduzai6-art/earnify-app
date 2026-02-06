const TRC20_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const BEP20_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function validateWalletAddress(network, address) {
  if (network === 'TRC20') return TRC20_REGEX.test(address);
  if (network === 'BEP20') return BEP20_REGEX.test(address);
  return false;
}

export function validatePasswordStrength(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  return /[^A-Za-z0-9]/.test(password);
}

export function generateReferralCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
