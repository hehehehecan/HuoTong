import { spawnSync } from 'node:child_process';

function getJavaVersionOutput() {
  const result = spawnSync('java', ['-version'], {
    encoding: 'utf8'
  });

  if (result.error) {
    return { ok: false, output: String(result.error.message || result.error) };
  }

  return {
    ok: result.status === 0,
    output: `${result.stderr || ''}\n${result.stdout || ''}`.trim()
  };
}

function parseJavaMajorVersion(output) {
  const match = output.match(/version "([^"]+)"/);

  if (!match) {
    return null;
  }

  const rawVersion = match[1];

  if (rawVersion.startsWith('1.')) {
    return Number.parseInt(rawVersion.split('.')[1], 10);
  }

  return Number.parseInt(rawVersion.split('.')[0], 10);
}

const { ok, output } = getJavaVersionOutput();
const majorVersion = parseJavaMajorVersion(output);

if (!ok || !majorVersion) {
  console.error('Unable to detect Java version. Install JDK 21+ and retry.');
  if (output) {
    console.error(output);
  }
  process.exit(1);
}

if (majorVersion < 21) {
  console.error(`Android build requires JDK 21+. Current Java major version: ${majorVersion}.`);
  console.error('Set JAVA_HOME to a JDK 21+ installation, then rerun this command.');
  process.exit(1);
}

console.log(`Java ${majorVersion} detected. Android Gradle build can proceed.`);
