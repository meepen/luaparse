import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SourceMapConsumer, RawSourceMap } from 'source-map';

async function findMapForJs(jsPath: string, jsUrlMaybe?: string): Promise<RawSourceMap | null> {
  // 1. Direct sibling .map
  const guess = jsPath + '.map';
  try {
    await access(guess);
    return JSON.parse(await readFile(guess, 'utf8')) as RawSourceMap;
  } catch {
    // ignore - no neighbor map
  }

  // 2. //# sourceMappingURL comment
  try {
    const content = await readFile(jsPath, 'utf8');
    const m = content.match(/\/\/#+ sourceMappingURL=(.+)(?![\n\r])$/m);
    if (m) {
      const url = m[1].trim();
      if (url.startsWith('data:')) {
        throw new Error('Inline data URL source maps not supported in this context');
      }
      const resolved = resolve(dirname(jsPath), url);
      await access(resolved);
      return JSON.parse(await readFile(resolved, 'utf8')) as RawSourceMap;
    }
  } catch {
    // ignore - no inline sourceMappingURL
  }

  // 3. Derive from file:// URL if provided
  if (typeof jsUrlMaybe === 'string' && jsUrlMaybe.startsWith('file://')) {
    const p2 = fileURLToPath(jsUrlMaybe) + '.map';
    try {
      await access(p2);
      return JSON.parse(await readFile(p2, 'utf8')) as RawSourceMap;
    } catch {
      // ignore - derived file:// map not found
    }
  }
  return null;
}

async function loadConsumer(mapRef: RawSourceMap | null): Promise<SourceMapConsumer | null> {
  if (!mapRef) return null;
  return await new SourceMapConsumer(mapRef);
}

function normalizeUrl(u: string | undefined): string | null {
  if (typeof u !== 'string' || u.length === 0) return null;
  if (u.startsWith('file://')) return fileURLToPath(u);
  if (isAbsolute(u)) return u;
  return resolve(u);
}

interface DevToolsCallFrame {
  url?: string | null;
  lineNumber?: number | null;
  columnNumber?: number | null;
  functionName?: string | null;
  [k: string]: unknown;
}

interface CPUProfileNode {
  callFrame?: DevToolsCallFrame; // Chrome format
  callframe?: DevToolsCallFrame; // alt spelling fallback
  functionName?: string;
  [k: string]: unknown;
}

export async function remapProfile(inPath: string, outPath: string): Promise<void> {
  const rawText = await readFile(inPath, 'utf8');
  const raw = JSON.parse(rawText) as { nodes?: unknown; profile?: { nodes?: unknown } };
  if (raw === null) return; // nothing to do
  type RawProfile = { nodes?: unknown; profile?: { nodes?: unknown } };
  const r = raw as RawProfile;
  const nodes: CPUProfileNode[] = Array.isArray(r.nodes)
    ? (r.nodes as CPUProfileNode[])
    : Array.isArray(r.profile?.nodes)
      ? (r.profile?.nodes as CPUProfileNode[])
      : [];
  const consumerCache = new Map<string, SourceMapConsumer | null>();

  for (const node of nodes) {
    const cf: DevToolsCallFrame | undefined =
      node.callFrame ||
      node.callframe ||
      (typeof node.functionName === 'string' && node.functionName.length > 0
        ? (node as unknown as DevToolsCallFrame)
        : undefined);
    if (!cf) {
      continue;
    }
    const { url, lineNumber, columnNumber } = cf;
    if (typeof url !== 'string' || url.length === 0 || typeof lineNumber !== 'number') {
      continue;
    }

    const jsPath = normalizeUrl(url);
    if (jsPath === null) {
      continue;
    }

    if (!consumerCache.has(jsPath)) {
      const mapRef = await findMapForJs(jsPath, url);
      if (mapRef !== null) {
        console.log(`Found source map for ${jsPath}`);
        const consumer = await loadConsumer(mapRef);
        consumerCache.set(jsPath, consumer);
      }
    }
    const consumer = consumerCache.get(jsPath);
    if (!consumer) continue;

    const pos = consumer.originalPositionFor({
      line: Number(lineNumber) + 1,
      column: Number(columnNumber ?? 0),
      bias: SourceMapConsumer.GREATEST_LOWER_BOUND,
    });

    if (pos !== null && typeof pos.source === 'string' && pos.source.length > 0 && typeof pos.line === 'number') {
      cf.url = pos.source.startsWith('file://') ? pos.source : pathToFileURL(resolve(pos.source)).href;
      if (typeof pos.name === 'string' && pos.name.length > 0) {
        cf.functionName = pos.name;
      }
      cf.lineNumber = pos.line - 1;
      const col = typeof pos.column === 'number' ? pos.column : 1;
      cf.columnNumber = Math.max(0, col - 1);
    }
  }

  await writeFile(outPath, JSON.stringify(raw));
  console.log(`Remapped profile written to ${outPath}`);

  for (const c of consumerCache.values()) {
    try {
      c?.destroy();
    } catch {
      /* ignore destroy error */
    }
  }
}
