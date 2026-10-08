/** تشخیص سکوت در blob صوتی (وب) */
export async function blobHasSpeech(
  blob: Blob,
  minRms = 0.012,
): Promise<boolean> {
  if (typeof AudioContext === 'undefined') {
    return true;
  }

  try {
    const buffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
    const samples = audioBuffer.getChannelData(0);

    if (!samples.length) {
      await audioContext.close();
      return false;
    }

    let sumSquares = 0;
    for (let i = 0; i < samples.length; i += 1) {
      sumSquares += samples[i] * samples[i];
    }

    const rms = Math.sqrt(sumSquares / samples.length);
    await audioContext.close();
    return rms >= minRms;
  } catch {
    return true;
  }
}
