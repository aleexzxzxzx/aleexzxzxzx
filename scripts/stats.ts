import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import type { Year } from '../src/worker';

export const START_DATE = new Date('2022-12-11T00:00:00.000Z');

export type Contribution = {
  contributionCount: number;
  date: string;
  contributionLevel:
    | 'NONE'
    | 'FIRST_QUARTILE'
    | 'SECOND_QUARTILE'
    | 'THIRD_QUARTILE'
    | 'FOURTH_QUARTILE';
};

export type Response = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: Contribution[];
          }[];
        };
      };
    };
  };
};

/**
 * Get a range of contributions from GitHub. You are limited to 1 year at a time.
 * @param date range of contributions to fetch (Max 1 year)
 */
export async function request(date: { from?: Date; to?: Date }) {
  const body = {
    query: `query ($username: String!, $from: DateTime, $to: DateTime) {
			user(login: $username) {
				contributionsCollection(from: $from, to: $to) {
					contributionCalendar {
						totalContributions
						weeks {
							contributionDays {
								contributionCount
								date
								contributionLevel
							}
						}
					}
				}
			}
		}
		`,
    variables: {
      username: 'aleexzxzxzx',
      from: date.from?.toISOString(),
      to: date.to?.toISOString()
    }
  };
  if (!process.env.API_TOKEN_GITHUB) throw new Error('API_TOKEN_GITHUB is required');
  const result = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'aleexzxzxzx/readme',
      Authorization: `bearer ${process.env.API_TOKEN_GITHUB}`
    },
    body: JSON.stringify(body)
  });
  if (!result.ok) throw new Error(`GitHub GraphQL HTTP ${result.status}`);
  const response = (await result.json()) as Response & { errors?: unknown[] };
  if (response.errors?.length || !response?.data?.user) {
    throw new Error(`GitHub GraphQL returned no user data: ${JSON.stringify(response)}`);
  }
  const calender = response.data.user.contributionsCollection.contributionCalendar;
  const weeks = calender.weeks;
  return { weeks, contributions: calender.totalContributions };
}

/**
 * Turn the GitHub contribution level into a number
 * @param level Contribution level
 */
const levelToInt = (level: Contribution['contributionLevel']) => {
  switch (level) {
    case 'NONE':
      return 0;
    case 'FIRST_QUARTILE':
      return 1;
    case 'SECOND_QUARTILE':
      return 2;
    case 'THIRD_QUARTILE':
      return 3;
    case 'FOURTH_QUARTILE':
      return 4;
  }
};

/**
 * Retrieves GitHub contributions within a specified date range.
 * Automatically handles pagination and fetches all contributions.
 * Limited to fetching 1-year intervals per GitHub's current restrictions.
 * Sorts contributions in reverse chronological order, showing most recent commits first.
 */
export async function getAllContributions(start: Date, end = new Date()) {
  const years: Year[] = [];
  let cursor = start;
  let contributions = 0;

  while (cursor < end) {
    let next = new Date(Date.UTC(cursor.getUTCFullYear() + 1, 0, 1));
    // prevent fetching data beyond the current date
    if (next > end) next = end;
    console.info('...Fetching from', cursor.toISOString(), next.toISOString());
    const to = next < end ? new Date(next.getTime() - 1) : next;
    const data = await request({ to, from: cursor });
    contributions += data.contributions;
    years.push({
      from: cursor.toISOString(),
      to: to.toISOString(),
      days: data.weeks
        .flatMap((week) => week.contributionDays.map((day) => levelToInt(day.contributionLevel)))
        .reverse()
    });
    cursor = next;
  }
  return { years: years.reverse(), contributions };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const stats = await getAllContributions(START_DATE);
  await writeFile('src/stats.json', JSON.stringify(stats));
  console.log('...Done');
}
