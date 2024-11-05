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
import { getAuthToken } from '@/lib/storage';
import { listUserRepos } from '@/lib/github';
import type { Board } from '@/types/app';

interface BoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Board>) => void;
  board: Board | null;
}

export function BoardDialog({ open, onOpenChange, onSubmit, board }: BoardDialogProps) {
  const [name, setName] = useState(board?.name || '');
  const [repos, setRepos] = useState<Array<{ owner: string; name: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [path, setPath] = useState('kanban-data.json');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadRepos();
      if (board) {
        setName(board.name);
        setSelectedRepo(`${board.gitConfig.owner}/${board.gitConfig.repo}`);
        setPath(board.gitConfig.path);
      } else {
        setName('');
        setSelectedRepo('');
        setPath('kanban-data.json');
      }
    }
  }, [open, board]);

  const loadRepos = async () => {
    const token = getAuthToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const userRepos = await listUserRepos(token);
      setRepos(userRepos);
    } catch (error) {
      console.error('Failed to list repositories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) return;

    const [owner, repo] = selectedRepo.split('/');
    onSubmit({
      name,
      gitConfig: { owner, repo, path },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{board ? 'Edit Board' : 'New Board'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter board name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo">Repository</Label>
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
            <Label htmlFor="path">Data File Path</Label>
            <Input
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="path/to/data.json"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !selectedRepo}>
              {board ? 'Save Changes' : 'Create Board'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}