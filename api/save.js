export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, content, password } = req.body;

  if (!filename || !content) {
    return res.status(400).json({ error: 'Missing filename or content' });
  }

  // Simple admin password check
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid password' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return res.status(500).json({ error: 'Server configuration error: GITHUB_TOKEN is not set.' });
  }

  const owner = 'rickdg';
  const repo = 'Warpigs';
  const branch = 'main';

  try {
    // 1. Get current file SHA if it exists
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch}`;
    const getRes = await fetch(getUrl, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'Warpigs-Admin',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let sha = null;
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }

    // 2. Commit the file to GitHub
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
    const base64Content = Buffer.from(content).toString('base64');
    
    const putBody = {
      message: `Update ${filename} via Web Admin Panel`,
      content: base64Content,
      branch
    };
    if (sha) {
      putBody.sha = sha;
    }

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'Warpigs-Admin',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      throw new Error(`GitHub API returned ${putRes.status}: ${errorText}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error saving to GitHub:', err);
    return res.status(500).json({ error: err.message });
  }
}
