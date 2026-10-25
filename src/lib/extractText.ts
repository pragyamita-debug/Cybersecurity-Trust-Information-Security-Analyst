/**
 * Turns an uploaded CV (PDF, DOCX or plain text) into plain text.
 * The heavy libraries are loaded on demand so the first paint stays light.
 */

export const ACCEPTED = '.pdf,.docx,.txt,.md';

export class UnsupportedFileError extends Error {}

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf') || file.type === 'application/pdf') return extractPdf(file);
  if (name.endsWith('.docx')) return extractDocx(file);
  if (name.endsWith('.doc')) {
    throw new UnsupportedFileError('Old .doc files can’t be read in the browser. Save it as .docx or PDF and try again.');
  }
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) return file.text();

  throw new UnsupportedFileError('That file type isn’t supported. Upload a PDF, DOCX or TXT file.');
}

async function extractPdf(file: File) {
  const pdfjs = await import('pdfjs-dist');
  // Inline worker keeps this working on any static host (and in the single-file build).
  const { default: PdfWorker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?worker&inline');
  if (!pdfjs.GlobalWorkerOptions.workerPort) pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Rebuild visual lines: group text runs by baseline, then order left → right.
    type Run = { x: number; y: number; w: number; h: number; str: string };
    const runs: Run[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const [, , , , x, y] = item.transform as number[];
      runs.push({ x, y, w: item.width, h: item.height || 10, str: item.str });
    }
    runs.sort((a, b) => b.y - a.y || a.x - b.x);

    const lines: Run[][] = [];
    for (const run of runs) {
      const line = lines[lines.length - 1];
      if (line && Math.abs(line[0].y - run.y) <= Math.max(2, run.h * 0.4)) line.push(run);
      else lines.push([run]);
    }

    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
      let text = '';
      let prevEnd = -Infinity;
      for (const run of line) {
        const gap = run.x - prevEnd;
        if (text) text += gap > run.h * 2.5 ? '   ' : gap > run.h * 0.15 && !text.endsWith(' ') ? ' ' : '';
        text += run.str;
        prevEnd = run.x + run.w;
      }
      pages.push(text.trim());
    }
  }

  const text = pages.join('\n');
  if (text.replace(/\s/g, '').length < 40) {
    throw new UnsupportedFileError('This PDF has no selectable text (it looks scanned). Export your CV as a text-based PDF or DOCX.');
  }
  return text;
}

async function extractDocx(file: File) {
  const mammoth = await import('mammoth/mammoth.browser');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value.replace(/\n{2,}/g, '\n');
}

export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
