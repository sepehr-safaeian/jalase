import {
  buildNoteExportHtml,
  buildNoteExportMarkdown,
  buildNoteExportPlainText,
  sanitizeExportFilename,
  type NoteExportSource,
} from '@jalase/shared';

const SHARE_TEXT_LIMIT = 1800;

function shareFilename(note: NoteExportSource): string {
  return sanitizeExportFilename(note.title);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyNoteContent(note: NoteExportSource): Promise<void> {
  const text = buildNoteExportPlainText(note);
  await navigator.clipboard.writeText(text);
}

export async function downloadNoteMarkdown(note: NoteExportSource): Promise<void> {
  const markdown = buildNoteExportMarkdown(note);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `${shareFilename(note)}.md`);
}

export async function downloadNotePdf(note: NoteExportSource): Promise<void> {
  const html = buildNoteExportHtml(note);
  const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const htmlUrl = URL.createObjectURL(htmlBlob);

  await new Promise<void>((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.src = htmlUrl;

    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        window.setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(htmlUrl);
        }, 1000);
      }
    };

    frame.onerror = () => {
      URL.revokeObjectURL(htmlUrl);
      reject(new Error('ساخت PDF ناموفق بود'));
    };

    document.body.appendChild(frame);
  });
}

function truncateForShare(text: string): string {
  if (text.length <= SHARE_TEXT_LIMIT) return text;
  return `${text.slice(0, SHARE_TEXT_LIMIT - 1)}…`;
}

function openShareWindow(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function shareNoteToTelegram(note: NoteExportSource): Promise<void> {
  const message = truncateForShare(buildNoteExportPlainText(note));
  openShareWindow(`https://t.me/share/url?text=${encodeURIComponent(message)}`);
}

export async function shareNoteToWhatsApp(note: NoteExportSource): Promise<void> {
  const message = truncateForShare(buildNoteExportPlainText(note));
  openShareWindow(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

export async function shareNoteViaSms(note: NoteExportSource): Promise<void> {
  const message = truncateForShare(buildNoteExportPlainText(note));
  window.location.href = `sms:?body=${encodeURIComponent(message)}`;
}

export async function shareNoteWithSystemSheet(note: NoteExportSource): Promise<void> {
  const message = buildNoteExportPlainText(note);
  if (navigator.share) {
    await navigator.share({ text: message, title: note.title });
    return;
  }
  await copyNoteContent(note);
}
