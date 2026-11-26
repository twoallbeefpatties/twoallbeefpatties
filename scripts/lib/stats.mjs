// Pulls the live numbers for the tiles from the GitHub GraphQL API.
// Without a token (local preview), it returns clearly fake demo numbers.

const QUERY = `
query ($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
      totalCount
      nodes {
        name
        stargazerCount
        pushedAt
        primaryLanguage { name }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name } } }
      }
    }
    pullRequests(states: MERGED) { totalCount }
    issues(states: CLOSED) { totalCount }
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

export async function getStats(login, token) {
  if (!token) return demoStats();
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': `${login}-profile` },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const u = json.data.user;
  const cc = u.contributionsCollection;

  const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
  const langs = {};
  for (const repo of u.repositories.nodes)
    for (const e of repo.languages.edges) langs[e.node.name] = (langs[e.node.name] ?? 0) + e.size;
  const topLanguage = Object.entries(langs).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const repos = {};
  for (const repo of u.repositories.nodes)
    repos[repo.name.toLowerCase()] = { stars: repo.stargazerCount, pushedAt: repo.pushedAt, language: repo.primaryLanguage?.name };

  return {
    demo: false,
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    contributions: cc.contributionCalendar.totalContributions,
    prsMerged: u.pullRequests.totalCount,
    issuesClosed: u.issues.totalCount,
    repoCount: u.repositories.totalCount,
    topLanguage,
    ...streaks(days),
    days,
    repos,
  };
}

/** Current and longest daily streak inside the calendar window. */
function streaks(days) {
  let longest = 0, run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  // Today may not have contributions yet; don't break the streak on it.
  const list = [...days];
  if (list.length && list[list.length - 1].contributionCount === 0) list.pop();
  for (let i = list.length - 1; i >= 0 && list[i].contributionCount > 0; i--) current++;
  return { currentStreak: current, longestStreak: longest };
}

function demoStats() {
  const days = [];
  const start = new Date();
  start.setDate(start.getDate() - 370);
  for (let i = 0; i < 371; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const w = Math.floor(i / 7), dow = i % 7;
    const v = (w * 7 + dow * 13 + (w % 5) * 3) % 11;
    days.push({ date: d.toISOString().slice(0, 10), contributionCount: v < 4 ? 0 : v - 3 });
  }
  return {
    demo: true,
    commits: 1234,
    contributions: days.reduce((a, d) => a + d.contributionCount, 0),
    prsMerged: 56,
    issuesClosed: 78,
    repoCount: 21,
    topLanguage: 'TypeScript',
    ...streaks(days),
    days,
    repos: {},
  };
}
