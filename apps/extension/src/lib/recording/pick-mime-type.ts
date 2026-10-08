export function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return (
    candidates.find((type) => MediaRecorder.isTypeSupported(type)) ??
    'audio/webm'
  );
}
