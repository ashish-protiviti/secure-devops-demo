// ============================================================
// ⚠️  DEMO FILE: vulnerable-example.js
// This file contains INTENTIONAL security vulnerabilities
// used to demonstrate CodeQL SAST detection.
// NEVER use patterns like these in production code.
// ============================================================

const db = require('./db');

// -------------------------------------------------------
// VULNERABILITY #1: SQL Injection
// CodeQL will flag this - user input directly in query
// -------------------------------------------------------
async function getUserByName_VULNERABLE(username) {
  // BAD: Direct string concatenation - SQL Injection risk
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  return await db.execute(query);
}

// FIXED version (show this after CodeQL flags the above):
async function getUserByName_SAFE(username) {
  // GOOD: Parameterized query
  const query = 'SELECT * FROM users WHERE username = ?';
  return await db.execute(query, [username]);
}

// -------------------------------------------------------
// VULNERABILITY #2: Hardcoded Secret
// GitHub Secret Scanning / CodeQL will catch this
// -------------------------------------------------------
const config_VULNERABLE = {
  // BAD: Hardcoded API key - will be caught by secret scanning
  apiKey: 'sk-live-xK92mNpQr7vL4wT8aB3cD6eF1gH0iJ5',
  dbPassword: 'SuperSecret@DB2024!A',
  jwtSecret: 'my-super-secret-jwt-key-12345'
};

// FIXED version:
const config_SAFE = {
  // GOOD: Loaded from environment variables
  apiKey: process.env.API_KEY,
  dbPassword: process.env.DB_PASSWORD,
  jwtSecret: process.env.JWT_SECRET
};

// -------------------------------------------------------
// VULNERABILITY #3: Path Traversal
// CodeQL will flag unsanitized file path usage
// -------------------------------------------------------
const fs = require('fs');
const path = require('path');

function readUserFile_VULNERABLE(req, res) {
  // BAD: User-controlled path input - path traversal risk
  const filename = req.query.file;
  const content = fs.readFileSync('/app/uploads/' + filename);
  res.send(content);
}

function readUserFile_SAFE(req, res) {
  // GOOD: Sanitize and resolve path, then validate it stays in allowed dir
  const filename = path.basename(req.query.file); // Strip directory traversal
  const safePath = path.resolve('/app/uploads', filename);
  const allowedDir = path.resolve('/app/uploads');

  if (!safePath.startsWith(allowedDir)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  const content = fs.readFileSync(safePath);
  res.send(content);
}

module.exports = {
  getUserByName_VULNERABLE,
  getUserByName_SAFE,
  readUserFile_VULNERABLE,
  readUserFile_SAFE
};
