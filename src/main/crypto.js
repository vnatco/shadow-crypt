const {
  randomBytes, createCipheriv, createDecipheriv,
  createHash, createHmac, scrypt,
} = require('crypto')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const scryptAsync = promisify(scrypt)
const CHUNK_SIZE = 64 * 1024

// scrypt parameters - N=2^17 requires ~64MB RAM per attempt, ~100ms on modern hardware
const SCRYPT_N = 131072
const SCRYPT_R = 8
const SCRYPT_P = 1

function sendProgress(event, percent, phase) {
  try { event.sender.send('crypto:progress', { percent, phase }) } catch {}
}

// Returns a path that doesn't exist yet: "file.aes", "file (1).aes", "file (2).aes", …
function uniquePath(filePath) {
  if (!fs.existsSync(filePath)) return filePath
  const ext = path.extname(filePath)
  const base = filePath.slice(0, filePath.length - ext.length)
  let i = 1
  while (fs.existsSync(`${base} (${i})${ext}`)) i++
  return `${base} (${i})${ext}`
}

/* ── ShadowCrypt v2 format (.aes) ── */
// Layout: "SCR2" | version(1=0x02) | salt(16) | iv(12) | authTag(16) | ciphertext
async function encryptFile(event, inputPath, password) {
  sendProgress(event, 5, 'Reading file…')
  const inputData = fs.readFileSync(inputPath)

  sendProgress(event, 10, 'Deriving key…')
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, 32, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 })

  sendProgress(event, 60, 'Encrypting…')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const chunks = []
  for (let i = 0; i < inputData.length; i += CHUNK_SIZE) {
    chunks.push(cipher.update(inputData.slice(i, i + CHUNK_SIZE)))
    const pct = 60 + Math.floor((i / Math.max(inputData.length, 1)) * 30)
    sendProgress(event, pct, 'Encrypting…')
  }
  chunks.push(cipher.final())
  const ciphertext = Buffer.concat(chunks)
  const authTag = cipher.getAuthTag()

  sendProgress(event, 95, 'Writing output…')
  const output = Buffer.concat([
    Buffer.from('SCR2'),
    Buffer.from([0x02]),
    salt,
    iv,
    authTag,
    ciphertext,
  ])
  const outputPath = uniquePath(inputPath + '.aes')
  fs.writeFileSync(outputPath, output)

  sendProgress(event, 100, 'Done')
  return { outputPath }
}

/* ── Decrypt: auto-detect format ── */
async function decryptFile(event, inputPath, password) {
  sendProgress(event, 5, 'Reading file…')
  const data = fs.readFileSync(inputPath)

  const magic = data.slice(0, 4).toString('ascii')

  if (data.slice(0, 3).toString('ascii') === 'AES' && data[3] === 0x02) {
    return decryptAesCrypt(event, data, inputPath, password)
  } else if (magic === 'SCR2') {
    return decryptShadowCryptV2(event, data, inputPath, password)
  } else {
    throw new Error('Unrecognized file format.')
  }
}

/* ── ShadowCrypt v2 decrypt ── */
async function decryptShadowCryptV2(event, data, inputPath, password) {
  if (data.length < 49) throw new Error('File is too small to be valid.')

  const salt      = data.slice(5, 21)
  const iv        = data.slice(21, 33)
  const authTag   = data.slice(33, 49)
  const ciphertext = data.slice(49)

  sendProgress(event, 10, 'Deriving key…')
  const key = await scryptAsync(password, salt, 32, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 })

  sendProgress(event, 60, 'Decrypting…')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  const chunks = []
  for (let i = 0; i < ciphertext.length; i += CHUNK_SIZE) {
    chunks.push(decipher.update(ciphertext.slice(i, i + CHUNK_SIZE)))
    const pct = 60 + Math.floor((i / Math.max(ciphertext.length, 1)) * 25)
    sendProgress(event, pct, 'Decrypting…')
  }

  sendProgress(event, 90, 'Verifying…')
  try {
    chunks.push(decipher.final())
  } catch {
    throw new Error('WRONG_PASSWORD')
  }

  const plaintext = Buffer.concat(chunks)

  sendProgress(event, 95, 'Writing output…')
  const rawPath = inputPath.endsWith('.aes')
    ? inputPath.slice(0, -4)
    : inputPath + '.decrypted'
  const outputPath = uniquePath(rawPath)
  fs.writeFileSync(outputPath, plaintext)

  sendProgress(event, 100, 'Done')
  return { outputPath }
}

/* ── AES Crypt v2 decrypt (legacy read-only) ── */
async function decryptAesCrypt(event, data, inputPath, password) {
  let offset = 5
  while (offset + 2 <= data.length) {
    const extLen = data.readUInt16BE(offset)
    offset += 2
    if (extLen === 0) break
    offset += extLen
  }

  if (offset + 16 + 48 + 32 + 33 > data.length) {
    throw new Error('AES Crypt file is truncated or corrupt.')
  }

  sendProgress(event, 10, 'Reading header…')
  const iv1 = data.slice(offset, offset + 16); offset += 16
  const encKeyBlock = data.slice(offset, offset + 48); offset += 48
  const storedHmac1 = data.slice(offset, offset + 32); offset += 32

  const encData = data.slice(offset, data.length - 33)
  const sizeMod16 = data[data.length - 33]
  const storedHmac2 = data.slice(data.length - 32)

  sendProgress(event, 15, 'Deriving key…')
  const pwBytes = Buffer.from(password, 'utf16le')
  let derivedKey = Buffer.alloc(32); iv1.copy(derivedKey)
  for (let i = 0; i < 8192; i++) {
    const h = createHash('sha256')
    h.update(derivedKey)
    h.update(pwBytes)
    derivedKey = h.digest()
  }

  const calcHmac1 = createHmac('sha256', derivedKey).update(encKeyBlock).digest()
  if (!calcHmac1.equals(storedHmac1)) throw new Error('WRONG_PASSWORD')

  sendProgress(event, 30, 'Decrypting…')

  const keyDecipher = createDecipheriv('aes-256-cbc', derivedKey, iv1)
  keyDecipher.setAutoPadding(false)
  const keyBlock = Buffer.concat([keyDecipher.update(encKeyBlock), keyDecipher.final()])
  const iv2 = keyBlock.slice(0, 16)
  const innerKey = keyBlock.slice(16, 48)

  const calcHmac2 = createHmac('sha256', innerKey).update(encData).digest()
  if (!calcHmac2.equals(storedHmac2)) throw new Error('WRONG_PASSWORD')

  sendProgress(event, 55, 'Decrypting…')

  const dataDecipher = createDecipheriv('aes-256-cbc', innerKey, iv2)
  dataDecipher.setAutoPadding(false)
  let plaintext = Buffer.concat([dataDecipher.update(encData), dataDecipher.final()])

  const padding = (16 - sizeMod16) % 16
  if (padding > 0) plaintext = plaintext.slice(0, plaintext.length - padding)

  sendProgress(event, 90, 'Writing output…')
  const rawPath = inputPath.endsWith('.aes')
    ? inputPath.slice(0, -4)
    : inputPath + '.decrypted'
  const outputPath = uniquePath(rawPath)
  fs.writeFileSync(outputPath, plaintext)

  sendProgress(event, 100, 'Done')
  return { outputPath }
}

module.exports = { encryptFile, decryptFile }
