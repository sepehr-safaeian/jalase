import { Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  buildNoteExportHtml,
  buildNoteExportMarkdown,
  buildNoteExportPlainText,
  sanitizeExportFilename,
  type NoteExportSource,
} from '@jalase/shared';

const SHARE_TEXT_LIMIT = 1800;

function buildExportSource(note: NoteExportSource): NoteExportSource {
  return note;
}

function shareFilename(note: NoteExportSource): string {
  return sanitizeExportFilename(note.title);
}

export async function copyNoteContent(note: NoteExportSource): Promise<void> {
  const text = buildNoteExportPlainText(buildExportSource(note));
  await Clipboard.setStringAsync(text);
}

export async function downloadNoteMarkdown(note: NoteExportSource): Promise<void> {
  const markdown = buildNoteExportMarkdown(buildExportSource(note));
  const filename = `${shareFilename(note)}.md`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, markdown, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/markdown',
      dialogTitle: 'دانلود Markdown',
    });
    return;
  }

  throw new Error('اشتراک‌گذاری فایل در این دستگاه پشتیبانی نمی‌شود');
}

export async function downloadNotePdf(note: NoteExportSource): Promise<void> {
  const html = buildNoteExportHtml(buildExportSource(note));
  const { uri } = await Print.printToFileAsync({ html });
  const filename = `${shareFilename(note)}.pdf`;
  const target = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.copyAsync({ from: uri, to: target });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target, {
      mimeType: 'application/pdf',
      dialogTitle: 'دانلود PDF',
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  throw new Error('اشتراک‌گذاری PDF در این دستگاه پشتیبانی نمی‌شود');
}

async function openUrlOrShare(url: string, fallbackMessage: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return;
  }

  await Share.share({ message: fallbackMessage });
}

function truncateForShare(text: string): string {
  if (text.length <= SHARE_TEXT_LIMIT) return text;
  return `${text.slice(0, SHARE_TEXT_LIMIT - 1)}…`;
}

export async function shareNoteToTelegram(note: NoteExportSource): Promise<void> {
  const message = truncateForShare(buildNoteExportPlainText(buildExportSource(note)));
  const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
  await openUrlOrShare(url, message);
}

export async function shareNoteToWhatsApp(note: NoteExportSource): Promise<void> {
  const message = truncateForShare(buildNoteExportPlainText(buildExportSource(note)));
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  await openUrlOrShare(url, message);
}

export async function shareNoteViaSms(note: NoteExportSource): Promise<void> {
  const message = truncateForShare(buildNoteExportPlainText(buildExportSource(note)));
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${separator}body=${encodeURIComponent(message)}`;
  await openUrlOrShare(url, message);
}

export async function shareNoteWithSystemSheet(note: NoteExportSource): Promise<void> {
  const message = buildNoteExportPlainText(buildExportSource(note));
  await Share.share({ message });
}
