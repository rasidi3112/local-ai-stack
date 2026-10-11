import fs from 'fs';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

const composePath = process.argv[2];
const envPath = process.argv[3] || (composePath ? `${composePath.replace(/docker-compose\.ya?ml$/, '')}.env` : null);

if (!composePath || !fs.existsSync(composePath)) {
  console.error(`Compose file not found: ${composePath}`);
  process.exit(1);
}

const content = fs.readFileSync(composePath, 'utf8');
const compose = yaml.load(content);

console.log('=== Probing Docker Compose Service Images for Healthcheck Tools ===');

function isDockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const dockerOk = isDockerAvailable();
if (!dockerOk) {
  console.log('[local/skip] Docker CLI not available on host. Skipping container runtime probes.');
}

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
  if (!dockerOk) {
    console.log(`[local/skip] Docker not available: cannot probe ${image}`);
    continue;
  }

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

      // Additional diagnostics
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

    if (
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

// -------------------------------------------------------------
// [Candidate Probe 1.a] Qdrant bash tcp candidate testing
// -------------------------------------------------------------
console.log('\n=== [Candidate Probe 1.a] Testing Qdrant TCP Healthcheck ===');
if (!dockerOk) {
  console.log('[local/skip] Docker not available: skipping Qdrant candidate test');
} else {
  const qdrantImage = services.qdrant?.image || 'qdrant/qdrant:v1.19.2';
  const qdrantContainer = 'probe-qdrant-test';
  try {
    execSync(`docker rm -f ${qdrantContainer} 2>/dev/null || true`, { stdio: 'ignore' });
    console.log(`Starting container ${qdrantContainer} (${qdrantImage}) in background...`);
    execSync(`docker run -d --name ${qdrantContainer} "${qdrantImage}"`, { stdio: 'inherit' });

    console.log('Waiting for Qdrant port 6333 to open...');
    let qdrantReady = false;
    for (let i = 0; i < 20; i++) {
      try {
        execSync(`docker exec ${qdrantContainer} bash -c ':> /dev/tcp/127.0.0.1/6333'`, { stdio: 'pipe' });
        qdrantReady = true;
        break;
      } catch {
        execSync('sleep 0.5', { stdio: 'ignore' });
      }
    }

    if (!qdrantReady) {
      throw new Error('Qdrant did not open port 6333 in time');
    }

    // 1. Test port 6333 (must exit 0)
    const port6333Res = execSync(
      `docker exec ${qdrantContainer} bash -c ':> /dev/tcp/127.0.0.1/6333'; echo "exit:$?"`,
      { encoding: 'utf8' }
    ).trim();
    console.log(`Qdrant port 6333 check result: ${port6333Res}`);
    if (port6333Res !== 'exit:0') {
      throw new Error(`Expected exit:0 for port 6333, got ${port6333Res}`);
    }
    console.log('PASS: Qdrant bash tcp check on port 6333 returned exit code 0');

    // 2. Test unused port 6399 (must exit non-zero)
    let port6399Exit = 0;
    try {
      execSync(`docker exec ${qdrantContainer} bash -c ':> /dev/tcp/127.0.0.1/6399'`, {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      port6399Exit = 0;
    } catch (err) {
      port6399Exit = err.status || 1;
    }
    console.log(`Qdrant unused port 6399 check exit code: ${port6399Exit}`);
    if (port6399Exit === 0) {
      throw new Error('Expected non-zero exit code for port 6399, got 0');
    }
    console.log(`PASS: Qdrant bash tcp check on unused port 6399 returned non-zero (${port6399Exit})`);
  } catch (err) {
    console.error(`Qdrant candidate probe error: ${err.message || err}`);
  } finally {
    execSync(`docker rm -f ${qdrantContainer} 2>/dev/null || true`, { stdio: 'ignore' });
  }
}

// -------------------------------------------------------------
// [Candidate Probe 1.b] API Gateway candidate testing
// -------------------------------------------------------------
console.log('\n=== [Candidate Probe 1.b] Testing API Gateway Healthcheck Candidate ===');
if (!dockerOk) {
  console.log('[local/skip] Docker not available: skipping API candidate test');
} else {
  try {
    const envArg = envPath && fs.existsSync(envPath) ? `--env-file "${envPath}"` : '';
    console.log(`Building API service image: docker compose -f "${composePath}" ${envArg} build api ...`);
    execSync(`docker compose -f "${composePath}" ${envArg} build api`, { stdio: 'inherit' });

    let apiImage = null;
    try {
      const configOut = execSync(`docker compose -f "${composePath}" ${envArg} config --format json`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const parsedConfig = JSON.parse(configOut);
      apiImage = parsedConfig.services?.api?.image;
    } catch {
      // ignore
    }

    if (!apiImage) {
      try {
        const imagesOut = execSync(`docker compose -f "${composePath}" ${envArg} images api --format json`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        const parsedImages = JSON.parse(imagesOut);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          apiImage = `${parsedImages[0].Repository}:${parsedImages[0].Tag}`;
        }
      } catch {
        // ignore
      }
    }

    if (!apiImage) {
      apiImage = 'pondok-ai-api';
    }
    console.log(`Resolved API Gateway image: ${apiImage}`);

    // Probe command -v curl and command -v wget
    console.log(`Probing curl in API image ${apiImage}...`);
    try {
      const curlOut = execSync(
        `docker run --rm --entrypoint sh "${apiImage}" -c 'command -v curl || echo MISSING:curl'`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      console.log(`API image curl probe: ${curlOut}`);
    } catch (err) {
      console.log(`API image curl probe error: ${err.message}`);
    }

    console.log(`Probing wget in API image ${apiImage}...`);
    try {
      const wgetOut = execSync(
        `docker run --rm --entrypoint sh "${apiImage}" -c 'command -v wget || echo MISSING:wget'`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      console.log(`API image wget probe: ${wgetOut}`);
    } catch (err) {
      console.log(`API image wget probe error: ${err.message}`);
    }

    // Run candidate in a running api container
    const probeNet = 'probe-api-net';
    const probeOllama = 'probe-ollama-for-api';
    const probeApi = 'probe-api-container';

    try {
      execSync(`docker network create ${probeNet} 2>/dev/null || true`, { stdio: 'ignore' });
      execSync(`docker rm -f ${probeOllama} ${probeApi} 2>/dev/null || true`, { stdio: 'ignore' });

      console.log('Starting Ollama background helper on probe network...');
      execSync(`docker run -d --name ${probeOllama} --network ${probeNet} ollama/ollama:0.40.2`, { stdio: 'inherit' });

      // Wait for ollama
      for (let i = 0; i < 20; i++) {
        try {
          execSync(`docker exec ${probeOllama} ollama list`, { stdio: 'pipe' });
          break;
        } catch {
          execSync('sleep 0.5', { stdio: 'ignore' });
        }
      }

      console.log(`Starting API container ${probeApi} on probe network...`);
      execSync(
        `docker run -d --name ${probeApi} --network ${probeNet} ` +
        `-e OLLAMA_BASE_URL="http://${probeOllama}:11434" ` +
        `-e API_SECRET_KEY="test-secret-probe-key" ` +
        `-e PORT=8000 ` +
        `"${apiImage}"`,
        { stdio: 'inherit' }
      );

      console.log('Waiting for API /health to respond inside container...');
      let apiReady = false;
      for (let i = 0; i < 30; i++) {
        try {
          execSync(
            `docker exec ${probeApi} node -e "fetch('http://127.0.0.1:8000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`,
            { stdio: 'pipe' }
          );
          apiReady = true;
          break;
        } catch {
          execSync('sleep 0.5', { stdio: 'ignore' });
        }
      }

      if (!apiReady) {
        const logs = execSync(`docker logs ${probeApi} 2>&1`, { encoding: 'utf8' });
        console.log(`API container logs:\n${logs}`);
        throw new Error('API /health did not become ready');
      }

      console.log('Testing candidate in running container:');
      const candidateCmd = `docker exec ${probeApi} node -e "fetch('http://127.0.0.1:8000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`;
      console.log(`$ ${candidateCmd}`);
      const apiCandRes = execSync(`${candidateCmd}; echo "exit:$?"`, { encoding: 'utf8' }).trim();
      console.log(`API candidate check result: ${apiCandRes}`);
      if (apiCandRes !== 'exit:0') {
        throw new Error(`Expected exit:0 for API candidate, got ${apiCandRes}`);
      }
      console.log('PASS: API candidate healthcheck returned exit code 0 inside running container!');
    } finally {
      execSync(`docker rm -f ${probeApi} ${probeOllama} 2>/dev/null || true`, { stdio: 'ignore' });
      execSync(`docker network rm ${probeNet} 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch (err) {
    console.error(`API candidate probe error: ${err.message || err}`);
  }
}
