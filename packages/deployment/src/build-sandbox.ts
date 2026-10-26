import * as crypto from 'crypto';
import { BuildJobPayload, BuildExecutionResult } from './types.js';

export class BuildSandboxRunner {
  /**
   * Runs an isolated, unprivileged build job within defined resource constraints.
   */
  async executeBuild(payload: BuildJobPayload): Promise<BuildExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    logs.push(`[Worker] Initializing unprivileged build container for commit ${payload.commitSha.substring(0, 7)}`);
    logs.push(`[Worker] Target framework: ${payload.framework}`);
    logs.push(`[Worker] Unpacking ${Object.keys(payload.files).length} source files into /workspace...`);

    // Verify vital entry files
    const hasEntryPoint =
      payload.files['src/App.tsx'] ||
      payload.files['src/main.tsx'] ||
      payload.files['index.html'];

    if (!hasEntryPoint) {
      logs.push(`[Error] Build failed: Missing required entrypoint (src/App.tsx or index.html)`);
      return {
        deploymentId: payload.deploymentId,
        commitSha: payload.commitSha,
        status: 'FAILED',
        durationMs: Date.now() - startTime,
        buildLogs: logs,
        error: 'Missing required entrypoint',
      };
    }

    // Check for simulated compiler error in source files
    for (const [filePath, content] of Object.entries(payload.files)) {
      if (content.includes('SIMULATE_COMPILE_ERROR')) {
        logs.push(`[Compiler Error] SyntaxError in ${filePath}: Unexpected token 'SIMULATE_COMPILE_ERROR'`);
        logs.push(`[Worker] Build process terminated with non-zero exit code 1`);
        return {
          deploymentId: payload.deploymentId,
          commitSha: payload.commitSha,
          status: 'FAILED',
          durationMs: Date.now() - startTime,
          buildLogs: logs,
          error: `SyntaxError in ${filePath}`,
        };
      }
    }

    // Simulate successful static compilation (Vite/Rollup bundle)
    logs.push(`[Build] Running vite build --mode production...`);
    logs.push(`[Build] transforming (12 modules)...`);
    logs.push(`[Build] rendering chunks...`);

    const bundleHash = crypto.randomBytes(4).toString('hex');
    const outputFiles: Record<string, string> = {
      'index.html': `<!DOCTYPE html><html><head><link rel="stylesheet" href="/assets/style-${bundleHash}.css"></head><body><div id="root"></div><script type="module" src="/assets/index-${bundleHash}.js"></script></body></html>`,
      [`assets/index-${bundleHash}.js`]: `/* Production bundle for commit ${payload.commitSha} */ (function(){ console.log('Ultrapie App Booted'); })();`,
      [`assets/style-${bundleHash}.css`]: `/* Minified styles */ body{margin:0;background:#090d16;}`,
    };

    logs.push(`[Build] dist/index.html                     0.45 kB`);
    logs.push(`[Build] dist/assets/style-${bundleHash}.css   2.18 kB │ gzip: 0.95 kB`);
    logs.push(`[Build] dist/assets/index-${bundleHash}.js   48.12 kB │ gzip: 14.20 kB`);
    logs.push(`[Worker] Build completed successfully in ${Date.now() - startTime}ms`);

    return {
      deploymentId: payload.deploymentId,
      commitSha: payload.commitSha,
      status: 'SUCCESS',
      durationMs: Date.now() - startTime,
      buildLogs: logs,
      outputFiles,
      bundleSizeKb: 50.75,
    };
  }
}
