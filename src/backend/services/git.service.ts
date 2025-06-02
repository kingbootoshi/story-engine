import { Octokit } from '@octokit/rest';
import { createLogger } from '../utils/logger';

const logger = createLogger('git.service');

export class GitService {
  private static instance: GitService;
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private defaultBranch: string = 'main';

  private constructor() {
    const token = process.env.GITHUB_REPO_TOKEN;
    if (!token) {
      throw new Error('GitHub token not found in environment variables');
    }

    this.octokit = new Octokit({
      auth: token
    });

    // Extract owner and repo from the remote URL
    // Assuming format: https://github.com/owner/repo
    const remoteUrl = process.env.GITHUB_REPO_URL || '';
    const match = remoteUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }

    [, this.owner, this.repo] = match;
    this.repo = this.repo.replace('.git', '');
  }

  static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService();
    }
    return GitService.instance;
  }

  async createOrUpdateFile(path: string, content: string, message: string): Promise<void> {
    try {
      logger.info(`Creating/updating file: ${path}`, { repo: this.repo });

      // Try to get existing file
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
          ref: this.defaultBranch
        });

        if (!Array.isArray(data)) {
          sha = data.sha;
        }
      } catch (error) {
        // File doesn't exist yet, that's okay
      }

      // Create or update file
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
        branch: this.defaultBranch
      });

      logger.success(`Successfully ${sha ? 'updated' : 'created'} file: ${path}`);
    } catch (error) {
      logger.error(`Failed to create/update file: ${path}`, error);
      throw error;
    }
  }

  async commitAndPush(files: Array<{ path: string; content: string }>, message: string): Promise<void> {
    try {
      logger.info('Committing files', { 
        fileCount: files.length, 
        message 
      });

      for (const file of files) {
        await this.createOrUpdateFile(file.path, file.content, message);
      }

      logger.success('Successfully committed and pushed files');
    } catch (error) {
      logger.error('Failed to commit and push files', error);
      throw error;
    }
  }

  async getFileContent(path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.defaultBranch
      });

      if (Array.isArray(data)) {
        throw new Error('Path points to a directory');
      }

      return Buffer.from(data.content, 'base64').toString();
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

export default GitService.getInstance();