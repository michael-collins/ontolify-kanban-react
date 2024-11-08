import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/storage';
import { saveToGitHub, fileExists } from '@/lib/github';
import { parseCSV } from '@/lib/csv';
import { FileUploadForm } from './library/FileUploadForm';
import type { GitConfig } from '@/types/app';
import type { LibraryFile } from '@/types/library';

interface LibraryUploadZoneProps {
  appGitConfig: GitConfig | null;
  onUploadComplete: (library: LibraryFile) => void;
}

interface PendingUpload {
  file: File;
  library: LibraryFile;
  content: string;
}

export function LibraryUploadZone({ appGitConfig, onUploadComplete }: LibraryUploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const { toast } = useToast();

  const processUpload = async (uploadFile: File, forceSave = false) => {
    try {
      if (!appGitConfig) {
        throw new Error('GitHub configuration is missing. Please configure GitHub settings first.');
      }

      const token = getAuthToken();
      if (!token) {
        throw new Error('GitHub token is missing. Please configure your GitHub token in the app settings.');
      }

      setIsUploading(true);

      const fileContent = await uploadFile.text();
      const { headers, content } = parseCSV(fileContent);

      if (!headers.length) {
        throw new Error('CSV file must contain at least one column header');
      }

      const safeName = uploadFile.name
        .replace(/\.csv$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');

      const newLibrary: LibraryFile = {
        id: crypto.randomUUID(),
        name: safeName,
        gitConfig: {
          ...appGitConfig,
          path: `libraries/${safeName}.csv`,
        },
        lastModified: new Date().toISOString(),
        fields: headers,
      };

      // Check if file exists
      if (!forceSave) {
        const exists = await fileExists({
          token,
          ...newLibrary.gitConfig,
        });

        if (exists) {
          setPendingUpload({ file: uploadFile, library: newLibrary, content });
          setNewFileName(safeName);
          setShowOverwriteDialog(true);
          return;
        }
      }

      await saveToGitHub({
        token,
        ...newLibrary.gitConfig,
      }, content);

      onUploadComplete(newLibrary);
      setFile(null);
      setPendingUpload(null);

      toast({
        title: 'Upload Successful',
        description: 'Library has been created successfully.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Upload error:', errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'Upload Failed',
        description: 'Please select a file',
        variant: 'destructive',
      });
      return;
    }
    await processUpload(file);
  };

  const handleOverwrite = async () => {
    if (pendingUpload) {
      await processUpload(pendingUpload.file, true);
      setShowOverwriteDialog(false);
    }
  };

  const handleRename = () => {
    if (pendingUpload && newFileName.trim()) {
      const safeName = newFileName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newName = `${safeName}.csv`;
      const newFile = new File([pendingUpload.file], newName, {
        type: pendingUpload.file.type,
      });
      processUpload(newFile, true);
      setShowOverwriteDialog(false);
      setNewFileName('');
    }
  };

  const handleDialogClose = () => {
    setShowOverwriteDialog(false);
    setNewFileName('');
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle>Upload Library</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <FileUploadForm
            onFileSelect={setFile}
            isUploading={isUploading}
            onSubmit={handleUpload}
          />
        </CardContent>
      </Card>

      <AlertDialog open={showOverwriteDialog} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>File Already Exists</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>A library file with this name already exists. Would you like to overwrite it or save with a new name?</p>
              <div className="space-y-2">
                <Label htmlFor="newFileName">New File Name</Label>
                <Input
                  id="newFileName"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter new name"
                />
                <p className="text-sm text-muted-foreground">
                  The file will be saved as: libraries/{newFileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRename} 
              className="bg-secondary hover:bg-secondary/90"
              disabled={!newFileName.trim()}
            >
              Save as New File
            </AlertDialogAction>
            <AlertDialogAction onClick={handleOverwrite} className="bg-destructive hover:bg-destructive/90">
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}