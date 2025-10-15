const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

if (require.main === module) {
  const password = process.argv[2];

  if (!password) {
    console.log('Usage: node hash.js <password>');
    console.log('Example: node hash.js mySecurePassword123');
    process.exit(1);
  }

  const hashedPassword = hashPassword(password);
  console.log('\n=== Password Hashed Successfully ===\n');
  console.log('Hashed Password:', hashedPassword);
  console.log('\nYou can use this in your Supabase SQL Editor to update a seller password:');
  console.log(`\nUPDATE sellers SET password_hash = '${hashedPassword}' WHERE email = 'seller@example.com';\n`);

  const isValid = verifyPassword(password, hashedPassword);
  console.log('Verification test:', isValid ? 'PASSED' : 'FAILED');
}

module.exports = { hashPassword, verifyPassword };
