/**
 * Download AMI annotations + Mix-Headset audio for meetings listed in data/ami-meetings.json.
 * Audio stays under packages/eval/.data/ (git-ignored).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dataRoot, loadAmiCatalog } from './catalog.js';
import { parseAmiMeetingGold } from './parse-annotations.js';

const ANNOTATIONS_URL =
  'https://groups.inf.ed.ac.uk/ami/AMICorpusAnnotations/ami_public_manual_1.6.2.zip';

function audioUrl(meetingId: string): string {
  return `https://groups.inf.ed.ac.uk/ami/AMICorpusMirror/amicorpus/${meetingId}/audio/${meetingId}.Mix-Headset.wav`;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) {
    console.log(`exists ${dest}`);
    return;
  }
  console.log(`GET ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  writeFileSync(dest, buf);
}

function unzip(zipPath: string, destDir: string): void {
  mkdirSync(destDir, { recursive: true });
  try {
    execFileSync('tar', ['-xf', zipPath, '-C', destDir], { stdio: 'inherit' });
    return;
  } catch {
    // fall through on Windows without tar zip support
  }
  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${destDir}'`,
    ],
    { stdio: 'inherit' },
  );
}

export async function fetchAmiData(): Promise<void> {
  const catalog = loadAmiCatalog();
  const root = dataRoot();
  const annotationsZip = join(root, 'ami_public_manual_1.6.2.zip');
  const annotationsDir = join(root, 'annotations');
  const audioDir = join(root, 'audio');
  const goldDir = join(root, 'gold');

  mkdirSync(root, { recursive: true });
  await downloadFile(ANNOTATIONS_URL, annotationsZip);
  unzip(annotationsZip, annotationsDir);

  mkdirSync(goldDir, { recursive: true });
  mkdirSync(audioDir, { recursive: true });

  for (const meeting of catalog.meetings) {
    try {
      const gold = parseAmiMeetingGold(annotationsDir, meeting.id);
      writeFileSync(
        join(goldDir, `${meeting.id}.json`),
        `${JSON.stringify(gold, null, 2)}\n`,
        'utf8',
      );
      console.log(
        `gold ${meeting.id}: words=${gold.referenceTranscript.split(/\s+/).length} decisions=${gold.decisions.length} actions=${gold.next_actions.length}`,
      );
    } catch (error) {
      console.warn(`gold parse failed for ${meeting.id}: ${String(error)}`);
    }

    const wav = join(audioDir, `${meeting.id}.Mix-Headset.wav`);
    try {
      await downloadFile(audioUrl(meeting.id), wav);
    } catch (error) {
      console.warn(`audio download failed for ${meeting.id}: ${String(error)}`);
    }
  }

  writeFileSync(
    join(root, 'README.txt'),
    [
      'AMI Meeting Corpus data for Jalase evaluation.',
      catalog.citation,
      catalog.license,
      catalog.attributionUrl,
      '',
      'Do not commit this directory.',
    ].join('\n'),
    'utf8',
  );

  console.log(`AMI data ready under ${root}`);
}

const invoked = process.argv[1]?.replace(/\\/g, '/');
if (invoked?.endsWith('/fetch-ami.ts') || invoked?.endsWith('/fetch-ami.js')) {
  fetchAmiData().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
