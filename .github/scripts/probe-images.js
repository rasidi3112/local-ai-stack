import fs from 'fs';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

const composePath = process.argv[2];
if (!composePath || !fs.existsSync(composePath)) {
  console.error(`Compose file not found: ${composePath}`);
  process.exit(1);
}

const content = fs.readFileSync(composePath, 'utf8');
const compose = yaml.load(content);

console.log('=== Probing Docker Compose Service Images for Healthcheck Tools ===');

const services = compose.services || {};

for (const [name, svc] of Object.entries(services)) {
  const image = svc.image;
  if (!image) {
    console.log(`[probe] Service '${name}': No pre-built image (build context: ${svc.build?.context || 'local'})`);
    continue;
  }

  let tool = null;
  if (svc.healthcheck && Array.isArray(svc.healthcheck.test)) {
    const test = svc.healthcheck.test;
    if (test[0] === 'CMD-SHELL') {
      const match = String(test[1]).match(/^\s*([^\s|&;]+)/);
      if (match) tool = match[1];
    } else if (test[0] === 'CMD') {
      tool = test[1];
    }
  }

  if (!tool) {
    console.log(`[probe] Service '${name}' (${image}): No healthcheck defined in compose`);
    continue;
  }

  console.log(`\n--- Probing service '${name}' (${image}) for tool: '${tool}' ---`);
  const probeCmd = `docker run --rm --entrypoint sh "${image}" -c 'command -v ${tool} || echo MISSING:${tool}'`;
  console.log(`$ ${probeCmd}`);

  try {
    const output = execSync(probeCmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    console.log(`Result: ${output}`);

    if (output.includes(`MISSING:${tool}`)) {
      console.log(`::warning title=Missing Tool [${name}]::Image ${image} is missing healthcheck tool '${tool}'`);

      // Additional diagnostics to see what binaries exist in this image
      try {
        const diagCmd = `docker run --rm --entrypoint sh "${image}" -c 'echo "which sh:" $(command -v sh) "which bash:" $(command -v bash) "which wget:" $(command -v wget) "which ollama:" $(command -v ollama)'`;
        const diagOut = execSync(diagCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        console.log(`Diagnostics: ${diagOut}`);
      } catch {
        // ignore diag error
      }
    } else {
      console.log(`::notice title=Tool Found [${name}]::Image ${image} has tool '${tool}' at ${output}`);
    }
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    const errText = (stderr + ' ' + stdout + ' ' + (err.message || '')).trim();

    if (errText.includes('docker: command not found') || errText.includes('docker: not found')) {
      console.log(`[local/skip] Docker CLI not installed on host: cannot probe ${image}`);
    } else if (
      errText.includes('exec: "sh"') ||
      errText.includes('exec: \\"sh\\"') ||
      errText.includes('entrypoint') ||
      errText.includes('executable file not found')
    ) {
      console.log(`NO_SH: Image ${image} does not have 'sh' (error: ${errText})`);
      console.log(`::warning title=Missing sh [${name}]::Image ${image} does not have 'sh'`);
    } else {
      console.log(`Error probing ${image}: ${errText}`);
    }
  }
}
