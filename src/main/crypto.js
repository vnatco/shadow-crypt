const {
  randomBytes, createCipheriv, createDecipheriv,
  createHash, createHmac, scrypt,
} = require('crypto')
const { promisify } = require('util')
const { Transform } = require('stream')
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

function readBytes(filePath, offset, length) {
  const buf = Buffer.alloc(length)
  const fd = fs.openSync(filePath, 'r')
  const n = fs.readSync(fd, buf, 0, length, offset)
  fs.closeSync(fd)
  return buf.slice(0, n)
}

/* ── ShadowCrypt v2 format (.aes) ── */
// Layout: "SCR2" | version(1=0x02) | salt(16) | iv(12) | authTag(16) | ciphertext
async function encryptFile(event, inputPath, password, signal) {
  sendProgress(event, 2, 'Deriving key…')
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, 32, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 })
  if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError')

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const outputPath = uniquePath(inputPath + '.aes')
  const fileSize = fs.statSync(inputPath).size
  let processed = 0

  // Write header with 16-byte authTag placeholder (patched after encryption completes)
  // Offsets: magic(4) version(1) salt(16) iv(12) authTag(16) = 49 bytes total
  const header = Buffer.concat([
    Buffer.from('SCR2'),
    Buffer.from([0x02]),
    salt,
    iv,
    Buffer.alloc(16),
  ])
  fs.writeFileSync(outputPath, header)

  await new Promise((resolve, reject) => {
    let settled = false
    const inputStream = fs.createReadStream(inputPath, { highWaterMark: CHUNK_SIZE, signal })
    // flags:'r+' keeps the header; start:49 appends ciphertext after it
    const outputStream = fs.createWriteStream(outputPath, { flags: 'r+', start: 49, signal })

    const done = (err) => {
      if (settled) return
      settled = true
      if (err) {
        inputStream.destroy()
        outputStream.destroy()
        outputStream.once('close', () => {
          try { fs.unlinkSync(outputPath) } catch {}
          reject(err)
        })
      } else {
        resolve()
      }
    }

    inputStream.on('data', chunk => {
      processed += chunk.length
      sendProgress(event, 5 + Math.floor((processed / Math.max(fileSize, 1)) * 88), 'Encrypting…')
    })

    inputStream.on('error', done)
    cipher.on('error', done)
    outputStream.on('error', done)
    outputStream.on('finish', () => done(null))

    inputStream.pipe(cipher).pipe(outputStream)
  })

  // Patch the real authTag into the placeholder at header offset 33
  const authTag = cipher.getAuthTag()
  const fd = fs.openSync(outputPath, 'r+')
  fs.writeSync(fd, authTag, 0, 16, 33)
  fs.closeSync(fd)

  sendProgress(event, 100, 'Done')
  return { outputPath }
}

/* ── Decrypt: auto-detect format ── */
async function decryptFile(event, inputPath, password, signal) {
  sendProgress(event, 2, 'Reading header…')
  const magic = readBytes(inputPath, 0, 5)

  if (magic.slice(0, 3).toString('ascii') === 'AES' && magic[3] === 0x02) {
    return decryptAesCrypt(event, inputPath, password, signal)
  } else if (magic.slice(0, 4).toString('ascii') === 'SCR2') {
    return decryptShadowCryptV2(event, inputPath, password, signal)
  } else {
    throw new Error('Unrecognized file format.')
  }
}

/* ── ShadowCrypt v2 decrypt ── */
async function decryptShadowCryptV2(event, inputPath, password, signal) {
  const header = readBytes(inputPath, 0, 49)
  if (header.length < 49) throw new Error('File is too small to be valid.')

  const salt    = header.slice(5, 21)
  const iv      = header.slice(21, 33)
  const authTag = header.slice(33, 49)

  sendProgress(event, 3, 'Deriving key…')
  const key = await scryptAsync(password, salt, 32, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 })
  if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError')

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  const fileSize = fs.statSync(inputPath).size
  let processed = 0

  const rawPath = inputPath.endsWith('.aes') ? inputPath.slice(0, -4) : inputPath + '.decrypted'
  const outputPath = uniquePath(rawPath)

  await new Promise((resolve, reject) => {
    let settled = false
    const inputStream  = fs.createReadStream(inputPath, { start: 49, highWaterMark: CHUNK_SIZE, signal })
    const outputStream = fs.createWriteStream(outputPath, { signal })

    const done = (err) => {
      if (settled) return
      settled = true
      if (err) {
        // Destroy streams first so Windows releases the file handle, then unlink
        inputStream.destroy()
        outputStream.destroy()
        outputStream.once('close', () => {
          try { fs.unlinkSync(outputPath) } catch {}
          reject(err)
        })
      } else {
        resolve()
      }
    }

    inputStream.on('data', chunk => {
      processed += chunk.length
      sendProgress(event, 5 + Math.floor((processed / Math.max(fileSize - 49, 1)) * 90), 'Decrypting…')
    })

    // GCM auth tag mismatch surfaces as an error event on the decipher
    decipher.on('error', () => done(new Error('WRONG_PASSWORD')))
    inputStream.on('error', done)
    outputStream.on('error', done)
    outputStream.on('finish', () => done(null))

    inputStream.pipe(decipher).pipe(outputStream)
  })

  sendProgress(event, 100, 'Done')
  return { outputPath }
}

/* ── AES Crypt v2 decrypt (legacy read-only) ── */
async function decryptAesCrypt(event, inputPath, password, signal) {
  const fileSize = fs.statSync(inputPath).size

  // Parse variable-length extension blocks — header is typically < 1 KB
  const headerArea = readBytes(inputPath, 0, Math.min(65536, fileSize))
  let offset = 5
  while (offset + 2 <= headerArea.length) {
    const extLen = headerArea.readUInt16BE(offset)
    offset += 2
    if (extLen === 0) break
    offset += extLen
  }

  if (offset + 16 + 48 + 32 + 33 > fileSize) {
    throw new Error('AES Crypt file is truncated or corrupt.')
  }

  sendProgress(event, 3, 'Reading header…')
  const iv1         = headerArea.slice(offset, offset + 16); offset += 16
  const encKeyBlock = headerArea.slice(offset, offset + 48); offset += 48
  const storedHmac1 = headerArea.slice(offset, offset + 32); offset += 32
  const dataStart   = offset

  // Last 33 bytes: sizeMod16(1) + storedHmac2(32)
  const fileTail   = readBytes(inputPath, fileSize - 33, 33)
  const sizeMod16  = fileTail[0]
  const storedHmac2 = fileTail.slice(1)

  sendProgress(event, 5, 'Deriving key…')
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

  const keyDecipher = createDecipheriv('aes-256-cbc', derivedKey, iv1)
  keyDecipher.setAutoPadding(false)
  const keyBlock = Buffer.concat([keyDecipher.update(encKeyBlock), keyDecipher.final()])
  const iv2      = keyBlock.slice(0, 16)
  const innerKey = keyBlock.slice(16, 48)

  const encDataSize = fileSize - dataStart - 33
  const padding     = (16 - sizeMod16) % 16
  const hmac2       = createHmac('sha256', innerKey)
  let processed     = 0

  const rawPath    = inputPath.endsWith('.aes') ? inputPath.slice(0, -4) : inputPath + '.decrypted'
  const outputPath = uniquePath(rawPath)

  await new Promise((resolve, reject) => {
    let settled = false
    const inputStream  = fs.createReadStream(inputPath, { start: dataStart, end: fileSize - 34, highWaterMark: CHUNK_SIZE, signal })
    const outputStream = fs.createWriteStream(outputPath, { signal })

    const done = (err) => {
      if (settled) return
      settled = true
      if (err) {
        inputStream.destroy()
        outputStream.destroy()
        outputStream.once('close', () => {
          try { fs.unlinkSync(outputPath) } catch {}
          reject(err)
        })
      } else {
        resolve()
      }
    }

    // Accumulate HMAC2 over the raw ciphertext as it streams through
    const hmacAccum = new Transform({
      transform(chunk, _, cb) {
        hmac2.update(chunk)
        processed += chunk.length
        sendProgress(event, 8 + Math.floor((processed / Math.max(encDataSize, 1)) * 87), 'Decrypting…')
        cb(null, chunk)
      },
    })

    // Buffer one chunk so we can trim AES Crypt padding from the very last block
    let pendingChunk = null
    const trimPadding = new Transform({
      transform(chunk, _, cb) { if (pendingChunk) cb(null, pendingChunk); else cb(); pendingChunk = chunk },
      flush(cb) {
        if (pendingChunk && padding > 0) cb(null, pendingChunk.slice(0, pendingChunk.length - padding))
        else if (pendingChunk) cb(null, pendingChunk)
        else cb()
      },
    })

    const dataDecipher = createDecipheriv('aes-256-cbc', innerKey, iv2)
    dataDecipher.setAutoPadding(false)

    outputStream.on('finish', () => {
      const calcHmac2 = hmac2.digest()
      if (!calcHmac2.equals(storedHmac2)) done(new Error('WRONG_PASSWORD'))
      else done(null)
    })

    dataDecipher.on('error', done)
    inputStream.on('error', done)
    outputStream.on('error', done)

    inputStream.pipe(hmacAccum).pipe(dataDecipher).pipe(trimPadding).pipe(outputStream)
  })

  sendProgress(event, 100, 'Done')
  return { outputPath }
}

module.exports = { encryptFile, decryptFile }
