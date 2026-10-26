import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      token,
      repoName,
      isNew = true,
      isPrivate = false,
      branch = 'main',
      commitMessage = 'Deploy from Ultrapie Studio',
      files = {},
    } = await req.json();

    if (!token || !token.trim()) {
      return NextResponse.json(
        { error: 'GitHub Personal Access Token is required' },
        { status: 400 }
      );
    }

    if (!repoName || !repoName.trim()) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }

    const cleanToken = token.trim();
    const headers = {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Ultrapie-Studio-App',
      'Content-Type': 'application/json',
    };

    // 1. Authenticate & get current GitHub user
    const userRes = await fetch('https://api.github.com/user', { headers });
    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Invalid GitHub token. Please check permissions.' },
        { status: 401 }
      );
    }
    const user = await userRes.json();
    const owner = user.login;

    let repoFullName = `${owner}/${repoName.trim()}`;
    let repoUrl = `https://github.com/${repoFullName}`;

    // 2. If new repository requested, create it
    if (isNew) {
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: repoName.trim(),
          private: Boolean(isPrivate),
          auto_init: true,
          description: 'Deployed directly from Ultrapie Vibe Studio (ultrapie.com)',
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        // If repo already exists, allow pushing to it
        if (createRes.status !== 422) {
          return NextResponse.json(
            { error: err.message || 'Failed to create GitHub repository' },
            { status: createRes.status }
          );
        }
      } else {
        const createdRepo = await createRes.json();
        repoUrl = createdRepo.html_url || repoUrl;
        repoFullName = createdRepo.full_name || repoFullName;
      }
    } else {
      // Check existing repository
      const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repoName.trim()}`, {
        headers,
      });
      if (!checkRes.ok) {
        return NextResponse.json(
          { error: `Existing repository '${owner}/${repoName.trim()}' was not found.` },
          { status: 404 }
        );
      }
      const existingRepo = await checkRes.json();
      repoUrl = existingRepo.html_url;
    }

    // 3. Push files to the repository
    const fileEntries = Object.entries(files as Record<string, string>);
    let filesPushed = 0;

    for (const [path, content] of fileEntries) {
      const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

      // Check if file already exists to get its blob SHA
      const getFileRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName.trim()}/contents/${path}?ref=${branch}`,
        { headers }
      );

      let existingSha: string | undefined = undefined;
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        existingSha = fileData.sha;
      }

      // Put/Update file
      const putRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName.trim()}/contents/${path}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: commitMessage,
            content: contentBase64,
            branch,
            sha: existingSha,
          }),
        }
      );

      if (putRes.ok) {
        filesPushed++;
      }
    }

    return NextResponse.json({
      success: true,
      repoUrl,
      repoFullName,
      filesPushed,
      message: `Successfully deployed ${filesPushed} files to ${repoFullName} on branch '${branch}'!`,
    });
  } catch (error: any) {
    console.error('GitHub deploy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error deploying to GitHub' },
      { status: 500 }
    );
  }
}
