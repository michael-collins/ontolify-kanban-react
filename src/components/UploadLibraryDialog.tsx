import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { LibraryItem } from '@/types/library';

interface UploadLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (items: LibraryItem[]) => void;
}

export function UploadLibraryDialog({
  open,
  onOpenChange,
  onUpload,
}: UploadLibraryDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const [headers, ...dataRows] = rows;

      if (!validateHeaders(headers)) {
        throw new Error('Invalid CSV format. Required columns: Term, Definition, Category, AssociatedMaterial');
      }

      const items: LibraryItem[] = dataRows.map(row => ({
        term: row[0],
        definition: row[1],
        category: row[2],
        associatedMaterial: row[3],
      }));

      onUpload(items);
      toast({
        title: 'Library Updated',
        description: 'Successfully uploaded library items',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const validateHeaders = (headers: string[]) => {
    const required = ['Term', 'Definition', 'Category', 'AssociatedMaterial'];
    return required.every(header => 
      headers.map(h => h.trim().toLowerCase()).includes(header.toLowerCase())
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Library CSV</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              CSV must include: Term, Definition, Category, AssociatedMaterial
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file}>
              Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}