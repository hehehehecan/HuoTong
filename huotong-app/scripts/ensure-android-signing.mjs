import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const androidDir = path.join(projectRoot, 'android');
const propsPath = path.join(androidDir, 'keystore.properties');

if (!fs.existsSync(propsPath)) {
  console.error('Missing android/keystore.properties.');
  console.error('Copy android/keystore.properties.example to android/keystore.properties and fill real signing values.');
  process.exit(1);
}

const raw = fs.readFileSync(propsPath, 'utf8');
const lines = raw
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

const props = new Map();
for (const line of lines) {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    props.set(key, value);
  }
}

const requiredKeys = ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'];
const missingKeys = requiredKeys.filter((key) => !props.get(key));

if (missingKeys.length > 0) {
  console.error(`keystore.properties is missing required keys: ${missingKeys.join(', ')}`);
  process.exit(1);
}

const storeFileValue = props.get('storeFile');
const storeFilePath = path.resolve(androidDir, storeFileValue);

if (!fs.existsSync(storeFilePath)) {
  console.error(`Keystore file not found: ${storeFilePath}`);
  process.exit(1);
}

console.log(`Android signing config detected: ${storeFilePath}`);
