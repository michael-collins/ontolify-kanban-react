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
import { listUserRepos, fileExists } from '@/lib/github';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [showOverwriteAlert, setShowOverwriteAlert] = useState(false);
  const [pendingData, setPendingData] = useState<Partial<Board> | null>(null);

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

  const checkAndSubmit = async (data: Partial<Board>) => {
    const token = getAuthToken();
    if (!token || !selectedRepo) return;

    const [owner, repo] = selectedRepo.split('/');
    setIsLoading(true);

    try {
      const exists = await fileExists({
        token,
        owner,
        repo,
        path,
      });

      if (exists) {
        setPendingData(data);
        setShowOverwriteAlert(true);
        return;
      }

      // No existing file, proceed with save
      onSubmit(data);
    } catch (error) {
      console.error('Failed to check file existence:', error);
      // Proceed with save if we can't check
      onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) return;

    const [owner, repo] = selectedRepo.split('/');
    const data: Partial<Board> = {
      name,
      gitConfig: { owner, repo, path },
    };

    checkAndSubmit(data);
  };

  const handleConfirmOverwrite = () => {
    if (pendingData) {
      onSubmit(pendingData);
      setPendingData(null);
      setShowOverwriteAlert(false);
    }
  };

  return (
    <>
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

      <AlertDialog open={showOverwriteAlert} onOpenChange={setShowOverwriteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Existing Board Data?</AlertDialogTitle>
            <AlertDialogDescription>
              A board data file already exists at this location. Are you sure you want to overwrite it?
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