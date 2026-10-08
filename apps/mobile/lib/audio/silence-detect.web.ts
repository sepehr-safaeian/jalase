const SILENCE_RMS_THRESHOLD = 0.011;

export async function isBlobSilent(blob: Blob): Promise<boolean> {
  if (typeof AudioContext === 'undefined') {
    return false;
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    await audioContext.close();

    const channel = audioBuffer.getChannelData(0);
    if (!channel.length) return true;

    let sum = 0;
    for (let i = 0; i < channel.length; i += 4) {
      sum += channel[i] * channel[i];
    }
    const rms = Math.sqrt(sum / (channel.length / 4));
    return rms < SILENCE_RMS_THRESHOLD;
  } catch {
    return false;
  }
}
