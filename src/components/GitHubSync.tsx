import { useState, useEffect } from 'react';
import { ActionButton } from './buttons/ActionButton';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { saveToGitHub, loadFromGitHub, listUserRepos, type GitHubConfig } from '@/lib/github';
import { saveAuthToken, getAuthToken, clearAuthToken } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/types/kanban';

interface GitHubSyncProps {
  tasks: Task[];
  onLoadTasks: (tasks: Task[]) => void;
}

export function GitHubSync({ tasks, onLoadTasks }: GitHubSyncProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [repos, setRepos] = useState<Array<{ owner: string; name: string; }>>([]);
  const [path, setPath] = useState('kanban-data.json');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = getAuthToken();
    if (savedToken) {
      setToken(savedToken);
      handleConnect(savedToken);
    }
  }, []);

  const handleConnect = async (tokenToUse = token) => {
    setIsLoading(true);
    try {
      const userRepos = await listUserRepos(tokenToUse);
      setRepos(userRepos);
      setIsAuthenticated(true);
      saveAuthToken(tokenToUse);
      toast({
        title: 'Connected to GitHub',
        description: 'Successfully authenticated with GitHub',
      });
    } catch (error: any) {
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Please check your GitHub token and try again.',
        variant: 'destructive',
      });
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setSelectedRepo('');
    setRepos([]);
    setIsAuthenticated(false);
    clearAuthToken();
  };

  const handleSave = async () => {
    if (!selectedRepo || !token) {
      toast({
        title: 'Save Failed',
        description: 'Please select a repository first.',
        variant: 'destructive',
      });
      return;
    }

    const [owner, repo] = selectedRepo.split('/');
    const config: GitHubConfig = { token, owner, repo, path };

    setIsLoading(true);
    try {
      await saveToGitHub(config, JSON.stringify(tasks, null, 2));
      toast({
        title: 'Saved Successfully',
        description: `Tasks saved to ${owner}/${repo}/${path}`,
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save task data to GitHub',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedRepo || !token) {
      toast({
        title: 'Load Failed',
        description: 'Please select a repository first.',
        variant: 'destructive',
      });
      return;
    }

    const [owner, repo] = selectedRepo.split('/');
    const config: GitHubConfig = { token, owner, repo, path };

    setIsLoading(true);
    try {
      const content = await loadFromGitHub(config);
      const loadedTasks = JSON.parse(content) as Task[];
      onLoadTasks(loadedTasks);
      setIsOpen(false);
      toast({
        title: 'Loaded Successfully',
        description: `Tasks loaded from ${owner}/${repo}/${path}`,
      });
    } catch (error: any) {
      toast({
        title: 'Load Failed',
        description: error.message || 'Failed to load task data from GitHub',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <ActionButton
          variant="outline"
          size="sm"
          icon={<GitHubLogoIcon className="h-4 w-4" />}
        >
          {isAuthenticated ? 'Sync Tasks' : 'Connect GitHub'}
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isAuthenticated ? 'GitHub Synchronization' : 'Connect to GitHub'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {!isAuthenticated ? (
            <div className="space-y-2">
              <Label htmlFor="token">Personal Access Token</Label>
              <div className="flex gap-2">
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_..."
                />
                <ActionButton
                  onClick={() => handleConnect()}
                  disabled={!token}
                  isLoading={isLoading}
                >
                  Connect
                </ActionButton>
              </div>
              <p className="text-sm text-muted-foreground">
                Need a token?{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Kanban%20Board%20App"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Create one here
                </a>
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="repo">Repository</Label>
                <Select
                  value={selectedRepo}
                  onValueChange={setSelectedRepo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem
                        key={`${repo.owner}/${repo.name}`}
                        value={`${repo.owner}/${repo.name}`}
                      >
                        {repo.owner}/{repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="path">File Path</Label>
                <Input
                  id="path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="path/to/data.json"
                />
              </div>

              <div className="flex justify-between items-center">
                <ActionButton
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600"
                >
                  Disconnect
                </ActionButton>
                <div className="flex gap-2">
                  <ActionButton
                    variant="outline"
                    onClick={handleLoad}
                    disabled={!selectedRepo || isLoading}
                  >
                    Load
                  </ActionButton>
                  <ActionButton
                    onClick={handleSave}
                    disabled={!selectedRepo}
                    isLoading={isLoading}
                  >
                    Save
                  </ActionButton>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}