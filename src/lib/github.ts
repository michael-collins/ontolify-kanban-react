import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
  sha?: string;
  message?: string;
}

// Browser-compatible base64 encoding/decoding
function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

export async function fileExists(config: GitHubConfig): Promise<boolean> {
  const octokit = new Octokit({ auth: config.token });
  
  try {
    await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.path,
    });
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

export async function saveToGitHub(config: GitHubConfig, content: string): Promise<void> {
  const octokit = new Octokit({ auth: config.token });
  
  try {
    // Try to get the file first to get its SHA if it exists
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: config.path,
      });
      
      if ('sha' in data) {
        sha = data.sha;
      }
    } catch (error: any) {
      // File doesn't exist yet, which is fine
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update the file
    await octokit.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: config.path,
      message: config.message || 'Update kanban board data',
      content: encodeBase64(content),
      sha: config.sha || sha,
    });

  } catch (error: any) {
    if (error.status === 409) {
      // Handle conflict by retrying with latest SHA
      const { data } = await octokit.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        path: config.path,
      });

      if ('sha' in data) {
        await octokit.repos.createOrUpdateFileContents({
          owner: config.owner,
          repo: config.repo,
          path: config.path,
          message: config.message || 'Update kanban board data',
          content: encodeBase64(content),
          sha: data.sha,
        });
        return;
      }
    }

    let errorMessage = 'Failed to save to GitHub';
    
    if (error.response?.data?.message) {
      errorMessage += `: ${error.response.data.message}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    if (error.response?.status === 404) {
      errorMessage = 'Repository not found or insufficient permissions';
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid GitHub token or token expired';
    } else if (error.response?.status === 403) {
      errorMessage = 'Token lacks required permissions. Ensure it has repo access.';
    }

    throw new Error(errorMessage);
  }
}

export async function loadFromGitHub(config: GitHubConfig): Promise<string> {
  const octokit = new Octokit({ auth: config.token });
  
  try {
    const exists = await fileExists(config);
    if (!exists) {
      return ''; // Return empty string for non-existent files
    }

    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: config.path,
    });

    if ('type' in data && data.type === 'file' && 'content' in data) {
      return decodeBase64(data.content);
    }

    throw new Error('Expected file content but got directory listing');
  } catch (error: any) {
    let errorMessage = 'Failed to load from GitHub';

    if (error.response?.status === 404) {
      return ''; // Return empty string for non-existent files
    } else if (error.response?.data?.message) {
      errorMessage += `: ${error.response.data.message}`;
    }

    throw new Error(errorMessage);
  }
}

export async function listUserRepos(token: string): Promise<Array<{ owner: string; name: string; }>> {
  const octokit = new Octokit({ auth: token });
  
  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    return data.map(repo => ({
      owner: repo.owner.login,
      name: repo.name,
    }));
  } catch (error: any) {
    let errorMessage = 'Failed to list repositories';

    if (error.response?.status === 401) {
      errorMessage = 'Invalid GitHub token or token expired';
    } else if (error.response?.data?.message) {
      errorMessage += `: ${error.response.data.message}`;
    }

    throw new Error(errorMessage);
  }
}