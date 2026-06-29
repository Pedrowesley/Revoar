#!/usr/bin/env node
/**
 * Converte todos os .md do plan-revoar em PDF.
 * Diagramas Mermaid viram PNG antes da conversão.
 *
 * Uso:
 *   npm run pdf                    → todos os documentos
 *   npm run pdf:single docs/.../fase-00....md  → um arquivo
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { mdToPdf } from "md-to-pdf";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = join(ROOT, "pdf");
const ASSETS_DIR = join(OUT_DIR, ".mermaid-cache");
const CSS = join(__dirname, "pdf-style.css");

const DEFAULT_FILES = [
  "README.md",
  "docs/00-analise-de-mercado/fase-00-analise-de-mercado.md",
  "docs/01-product-discovery/fase-01-product-discovery.md",
  "docs/02-modelo-de-negocio/fase-02-modelo-de-negocio.md",
  "docs/03-requisitos/fase-03-requisitos.md",
  "docs/04-ux/fase-04-ux.md",
  "docs/05-system-design/fase-05-system-design.md",
  "docs/06-modelagem-dados/fase-06-modelagem-dados.md",
  "docs/07-integracoes/fase-07-integracoes.md",
  "docs/08-analise-riscos/fase-08-analise-riscos.md",
  "docs/09-roadmap/fase-09-roadmap.md",
  "docs/10-diagramas/fase-10-diagramas.md",
];

async function renderMermaidBlocks(markdown, docSlug) {
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let index = 0;
  let result = markdown;
  const replacements = [];

  for (const match of markdown.matchAll(regex)) {
    const code = match[1].trim();
    const pngName = `${docSlug}-diagram-${index}.png`;
    const pngPath = join(ASSETS_DIR, pngName);
    const mmdPath = join(ASSETS_DIR, `${docSlug}-diagram-${index}.mmd`);

    await writeFile(mmdPath, code, "utf8");

    try {
      await execFileAsync(
        "npx",
        ["mmdc", "-i", mmdPath, "-o", pngPath, "-b", "white", "-w", "1200"],
        { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }
      );
      // Embed as base64 so Puppeteer doesn't hit file:// restrictions
      const pngBuffer = await readFile(pngPath);
      const b64 = pngBuffer.toString("base64");
      replacements.push({
        original: match[0],
        replacement: `![Diagrama ${index + 1}](data:image/png;base64,${b64})`,
      });
    } catch (err) {
      console.warn(`  ⚠ Mermaid ${index + 1} falhou — mantendo bloco de código.`);
      replacements.push({
        original: match[0],
        replacement: match[0],
      });
    }
    index += 1;
  }

  for (const { original, replacement } of replacements) {
    result = result.replace(original, replacement);
  }

  return result;
}

async function convertFile(relPath) {
  const inputPath = join(ROOT, relPath);
  if (!existsSync(inputPath)) {
    console.warn(`Ignorado (não existe): ${relPath}`);
    return null;
  }

  const slug = relPath.replace(/[/\\]/g, "-").replace(/\.md$/, "");
  const outName = `${slug}.pdf`;
  const outPath = join(OUT_DIR, outName);

  console.log(`→ ${relPath}`);

  let markdown = await readFile(inputPath, "utf8");
  markdown = await renderMermaidBlocks(markdown, slug);

  const pdf = await mdToPdf(
    { content: markdown },
    {
      dest: outPath,
      css: CSS,
      pdf_options: {
        format: "A4",
        margin: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
        printBackground: true,
      },
      launch_options: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    }
  );

  if (!pdf) {
    throw new Error(`Falha ao gerar PDF: ${relPath}`);
  }

  console.log(`  ✓ ${relative(ROOT, outPath)}`);
  return outPath;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const files = args.length > 0 ? args : DEFAULT_FILES;

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  console.log("Exportando PDFs do Master Plan Revoar\n");

  const generated = [];
  for (const file of files) {
    try {
      const out = await convertFile(file);
      if (out) generated.push(out);
    } catch (err) {
      console.error(`  ✗ Erro em ${file}:`, err.message);
    }
  }

  console.log(`\nConcluído: ${generated.length} PDF(s) em pdf/`);

  if (generated.length === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
