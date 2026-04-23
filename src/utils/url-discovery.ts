import * as https from 'https';
import * as http from 'http';
import { logger } from './logger';

export interface SitemapDiscoverOptions {
  /** URL do sitemap (ou sitemap index). Ex: "https://arctouch.com/sitemap.xml" */
  url: string;
  /** Máximo de URLs a retornar. Padrão: 10 */
  maxUrls?: number;
  /** Regex para filtrar URLs. Ex: "^https://arctouch\\.com/" */
  filterPattern?: string;
  /** Seguir links de sitemap index (sitemapindex). Padrão: true */
  followIndex?: boolean;
}

export interface DiscoverResult {
  urls: string[];
  source: string;
  discovered: number;
  filtered: number;
  limited: number;
}

function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const options = {
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; performance-testing-poc/0.2.0)',
        'Accept': 'text/xml,application/xml,*/*',
      },
    };
    const req = lib.get(url, options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchText(res.headers.location, timeoutMs).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

/** Extrai todas as <loc> de um XML (urlset ou sitemapindex). */
function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    locs.push(m[1].trim());
  }
  return locs;
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex/i.test(xml);
}

async function fetchSitemapUrls(
  sitemapUrl: string,
  followIndex: boolean,
  visited = new Set<string>()
): Promise<string[]> {
  if (visited.has(sitemapUrl)) return [];
  visited.add(sitemapUrl);

  let xml: string;
  try {
    xml = await fetchText(sitemapUrl);
  } catch (err) {
    logger.warn(`Não foi possível buscar sitemap em ${sitemapUrl}: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }

  const locs = extractLocs(xml);

  if (isSitemapIndex(xml) && followIndex) {
    logger.info(`  Sitemap index encontrado em ${sitemapUrl} — seguindo ${locs.length} sub-sitemap(s)...`);
    const nested: string[] = [];
    for (const loc of locs) {
      if (loc.endsWith('.xml')) {
        const sub = await fetchSitemapUrls(loc, followIndex, visited);
        nested.push(...sub);
      } else {
        nested.push(loc);
      }
    }
    return nested;
  }

  return locs;
}

/**
 * Descobre URLs a partir de um sitemap.xml.
 * Segue sitemap index automaticamente e filtra por regex se fornecido.
 */
export async function discoverFromSitemap(options: SitemapDiscoverOptions): Promise<DiscoverResult> {
  const maxUrls = options.maxUrls ?? 10;
  const followIndex = options.followIndex !== false;
  const filterRe = options.filterPattern ? new RegExp(options.filterPattern, 'i') : null;

  logger.info(`Descobrindo URLs via sitemap: ${options.url}`);

  const rawAll = await fetchSitemapUrls(options.url, followIndex);
  // Normalizar URLs: remover trailing slash duplicado e deduplicar
  const seen = new Set<string>();
  const all = rawAll
    .map((u) => u.replace(/([^:])\/\/+/g, '$1/').replace(/\/$/, '') || u)
    .filter((u) => { if (seen.has(u)) return false; seen.add(u); return true; });
  const discovered = all.length;

  const filtered = filterRe ? all.filter((u) => filterRe.test(u)) : all;
  const filteredCount = all.length - filtered.length;

  const limited = filtered.slice(0, maxUrls);

  logger.info(
    `  Sitemap: ${discovered} URLs encontradas` +
    (filteredCount > 0 ? `, ${filteredCount} filtradas por padrão` : '') +
    `, ${limited.length} selecionadas (limite: ${maxUrls})`
  );

  return {
    urls: limited,
    source: options.url,
    discovered,
    filtered: filteredCount,
    limited: filtered.length - limited.length,
  };
}

/**
 * Tenta descobrir o sitemap de um domínio verificando os caminhos mais comuns.
 * Usa GET e verifica se o conteúdo é XML de sitemap (mais confiável que HEAD).
 */
export async function detectSitemapUrl(baseUrl: string): Promise<string | null> {
  const normalized = baseUrl.replace(/\/$/, '');
  const candidates = [
    `${normalized}/sitemap.xml`,
    `${normalized}/sitemap_index.xml`,
    `${normalized}/sitemap/sitemap.xml`,
    `${normalized}/wp-sitemap.xml`,
  ];

  for (const candidate of candidates) {
    try {
      const text = await fetchText(candidate, 10000);
      if (/<urlset|<sitemapindex/i.test(text)) {
        logger.info(`  Sitemap detectado: ${candidate}`);
        return candidate;
      }
    } catch {
      // tenta o próximo
    }
  }
  return null;
}
