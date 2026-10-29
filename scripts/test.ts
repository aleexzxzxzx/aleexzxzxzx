import assert from 'node:assert/strict';
import { getAllContributions, request } from './stats';
import { main, top } from '../src/render';

const originalFetch = globalThis.fetch;
const originalToken = process.env.API_TOKEN_GITHUB;
const ranges: { from: string; to: string }[] = [];
process.env.API_TOKEN_GITHUB = 'test';
try {
  globalThis.fetch = (async (_url, init) => {
    ranges.push(JSON.parse(init!.body as string).variables);
    return new Response(
      JSON.stringify({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: 12,
                weeks: [{ contributionDays: [{ contributionLevel: 'FOURTH_QUARTILE' }] }]
              }
            }
          }
        }
      })
    );
  }) as typeof fetch;
  const stats = await getAllContributions(
    new Date('2024-12-31T00:00:00Z'),
    new Date('2025-01-02T00:00:00Z')
  );
  assert.equal(stats.contributions, 24);
  assert.deepEqual(
    stats.years.map((year) => year.days),
    [[4], [4]]
  );
  assert.equal(ranges[0].to, '2024-12-31T23:59:59.999Z');
  assert.equal(ranges[1].from, '2025-01-01T00:00:00.000Z');
  assert.equal(stats.years[0].to, '2025-01-02T00:00:00.000Z');

  globalThis.fetch = (async (_url, _init) =>
    new Response('unavailable', { status: 503 })) as typeof fetch;
  await assert.rejects(request({}), /HTTP 503/);
  globalThis.fetch = (async (_url, _init) =>
    new Response(JSON.stringify({ errors: [{ message: 'Rate limited' }] }))) as typeof fetch;
  await assert.rejects(request({}), /Rate limited/);
  delete process.env.API_TOKEN_GITHUB;
  await assert.rejects(request({}), /API_TOKEN_GITHUB is required/);
} finally {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.API_TOKEN_GITHUB;
  else process.env.API_TOKEN_GITHUB = originalToken;
}

for (const [contributions, label] of [
  [340, '340'],
  [1300, '1.3k'],
  [1500, '1.5k']
] as const) {
  assert.ok(top({ contributions, height: 20, theme: 'dark' }).includes(`>${label}</span>`));
}
const image = main({
  height: 290,
  theme: 'dark',
  years: [{ from: '2025-01-01T00:00:00Z', to: '2025-01-02T12:00:00Z', days: [4] }],
  sizes: [[24, 169]],
  length: 24,
  location: { city: '', country: '' },
  dots: { rows: 6, size: 24, gap: 5 },
  year: { gap: 5 }
});
assert.ok(image.includes('Jan 2, 2025'));
assert.equal(image.match(/class="dot dot--4"/g)?.length, 2);
console.log('Stats and SVG checks passed');
