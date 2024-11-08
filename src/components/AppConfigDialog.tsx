import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuthToken, saveAuthToken } from '@/lib/storage';
import { listUserRepos, loadFromGitHub, fileExists } from '@/lib/github';
import { useToast } from '@/hooks/use-toast';
import type { AppConfig } from '@/types/app';

interface AppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AppConfig;
  onSubmit: (config: AppConfig) => void;
}

export function AppConfigDialog({ open, onOpenChange, config, onSubmit }: AppConfigDialogProps) {
  const [token, setToken] = useState('');
  const [repos, setRepos] = useState<Array<{ owner: string; name: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [path, setPath] = useState('kanban-config.json');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOverwriteAlert, setShowOverwriteAlert] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<AppConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = getAuthToken();
    if (savedToken) {
      setToken(savedToken);
      handleConnect(savedToken);
    }
  }, []);

  useEffect(() => {
    if (config.gitConfig) {
      setSelectedRepo(`${config.gitConfig.owner}/${config.gitConfig.repo}`);
      setPath(config.gitConfig.path);
    }
  }, [config]);

  const handleConnect = async (tokenToUse = token) => {
    setIsLoading(true);
    try {
      const userRepos = await listUserRepos(tokenToUse);
      setRepos(userRepos);
      setIsAuthenticated(true);
      saveAuthToken(tokenToUse);
    } catch (error) {
      console.error('Failed to list repositories:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedRepo) return;

    const [owner, repo] = selectedRepo.split('/');
    setIsLoading(true);

    try {
      const content = await loadFromGitHub({
        token,
        owner,
        repo,
        path,
      });

      if (!content) {
        toast({
          title: 'No Configuration Found',
          description: 'No existing configuration file was found in this repository.',
          variant: 'default',
        });
        return;
      }

      const loadedConfig = JSON.parse(content) as AppConfig;
      
      // Preserve the selected repo in the loaded config
      loadedConfig.gitConfig = { owner, repo, path };
      
      onSubmit(loadedConfig);
      toast({
        title: 'Configuration Loaded',
        description: 'Successfully loaded the configuration from GitHub.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Load Configuration',
        description: error.message || 'An error occurred while loading the configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndSave = async (configToSave: AppConfig) => {
    if (!selectedRepo) return;

    const [owner, repo] = selectedRepo.split('/');
    setIsLoading(true);

    try {
      const fileAlreadyExists = await fileExists({
        token,
        owner,
        repo,
        path,
      });

      if (fileAlreadyExists) {
        setPendingConfig(configToSave);
        setShowOverwriteAlert(true);
        return;
      }

      // No existing file, proceed with save
      onSubmit(configToSave);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check if configuration file exists',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) return;

    const [owner, repo] = selectedRepo.split('/');
    const updatedConfig: AppConfig = {
      ...config,
      gitConfig: { owner, repo, path },
    };

    checkAndSave(updatedConfig);
  };

  const handleConfirmOverwrite = () => {
    if (pendingConfig) {
      onSubmit(pendingConfig);
      setPendingConfig(null);
      setShowOverwriteAlert(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>App Configuration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {!isAuthenticated ? (
              <div className="space-y-2">
                <Label htmlFor="token">GitHub Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_..."
                  />
                  <Button
                    type="button"
                    onClick={() => handleConnect()}
                    disabled={!token || isLoading}
                  >
                    Connect
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Need a token?{' '}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Ontolify%20Kanban%20Board"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Create one here
                  </a>
                  {' '}(requires 'repo' scope)
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="repo">Configuration Repository</Label>
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
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
                  <Label htmlFor="path">Configuration File Path</Label>
                  <Input
                    id="path"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="path/to/config.json"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={handleLoad}
                    disabled={!selectedRepo || isLoading}
                  >
                    Load
                  </Button>
                  <Button type="submit" disabled={!selectedRepo || isLoading}>
                    Save
                  </Button>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showOverwriteAlert} onOpenChange={setShowOverwriteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Existing Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              A configuration file already exists at this location. Are you sure you want to overwrite it?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowOverwriteAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOverwrite}>
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}