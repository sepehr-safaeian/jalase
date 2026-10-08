const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'illustrations');
const keys = ['features', 'how-help', 'before', 'during', 'after', 'start'];

const entries = keys.map((key) => {
  const svg = fs.readFileSync(path.join(dir, `${key}.svg`), 'utf8');
  return `  ${JSON.stringify(key)}: ${JSON.stringify(svg)},`;
});

const out = `export const illustrationSources = {
${entries.join('\n')}
} as const;

export type IllustrationKey = keyof typeof illustrationSources;
`;

fs.writeFileSync(path.join(dir, 'sources.generated.ts'), out);
console.log(`Generated ${out.length} bytes`);
