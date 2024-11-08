import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/storage';
import { listUserRepos } from '@/lib/github';
import type { LibraryFile } from '@/types/library';

interface LibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<LibraryFile>) => void;
  library: LibraryFile | null;
}

export function LibraryDialog({
  open,
  onOpenChange,
  onSubmit,
  library,
}: LibraryDialogProps) {
  const [name, setName] = useState('');
  const [repos, setRepos] = useState<Array<{ owner: string; name: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [path, setPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (library) {
        setName(library.name);
        setSelectedRepo(`${library.gitConfig.owner}/${library.gitConfig.repo}`);
        setPath(library.gitConfig.path);
      } else {
        setName('');
        setSelectedRepo('');
        setPath('');
      }
      loadRepos();
    }
  }, [open, library]);

  // Auto-generate path when name changes (only for new libraries)
  useEffect(() => {
    if (!library && name) {
      const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setPath(`libraries/${safeName}.csv`);
    }
  }, [name, library]);

  const loadRepos = async () => {
    const token = getAuthToken();
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please configure your GitHub token in the app settings.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const userRepos = await listUserRepos(token);
      setRepos(userRepos);
    } catch (error: any) {
      toast({
        title: 'Failed to Load Repositories',
        description: error.message || 'Could not load repositories from GitHub',
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
    const data: Partial<LibraryFile> = {
      name,
      gitConfig: { owner, repo, path },
    };

    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{library ? 'Edit Library' : 'New Library'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Library Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter library name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo">Repository</Label>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading repositories..." : "Select repository"} />
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
            <Label htmlFor="path">CSV File Path</Label>
            <Input
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="path/to/library.csv"
            />
            <p className="text-sm text-muted-foreground">
              CSV must include: Term, Definition, Category, AssociatedMaterial
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !selectedRepo || isLoading}>
              {library ? 'Save Changes' : 'Create Library'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}