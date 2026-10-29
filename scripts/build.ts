import { mkdir, writeFile } from 'node:fs/promises';
import worker from '../src/worker';

await mkdir('dist', { recursive: true });
for (const theme of ['light', 'dark']) {
  for (const section of ['top', 'link-website', 'fallback', 'main']) {
    const response = await worker.fetch(
      new Request(`https://readme.aleexrgzz.dev?section=${section}&theme=${theme}&i=0`)
    );
    await writeFile(`dist/${section}-${theme}.svg`, await response.text());
  }
}
await writeFile('dist/_headers', '/*\n  Cache-Control: public, max-age=300, must-revalidate\n');
