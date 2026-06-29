// GitHub Search API（可选 GITHUB_TOKEN 提高配额）
async function fetchGithubRepos(query, limit) {
  const q = encodeURIComponent(query || 'AI agent');
  const n = Math.min(limit || 10, 20);
  const url = 'https://api.github.com/search/repositories?q=' + q + '&sort=stars&order=desc&per_page=' + n;
  const headers = {
    'User-Agent': 'poke-bot/1.0',
    'Accept': 'application/vnd.github+json'
  };
  const token = process.env.GITHUB_TOKEN || '';
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error('GitHub API HTTP ' + res.status);
  const data = await res.json();
  return (data.items || []).map(repo => ({
    title: repo.full_name + (repo.description ? ': ' + repo.description.slice(0, 80) : ''),
    desc: (repo.description || '') + ' ⭐' + (repo.stargazers_count || 0),
    link: repo.html_url,
    stars: repo.stargazers_count || 0,
    meta: { stars: repo.stargazers_count, language: repo.language }
  })).filter(it => it.title.length >= 4);
}

module.exports = { fetchGithubRepos };
