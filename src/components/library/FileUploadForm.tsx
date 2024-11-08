import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadFormProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function FileUploadForm({ onFileSelect, isUploading, onSubmit }: FileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('No file selected');
      }

      const selectedFile = e.target.files[0];
      
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please select a CSV file');
      }

      if (selectedFile.size === 0) {
        throw new Error('The selected file is empty');
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      setFile(selectedFile);
      onFileSelect(selectedFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      toast({
        title: 'Invalid File',
        description: errorMessage,
        variant: 'destructive',
      });
      e.target.value = '';
      setFile(null);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">CSV File</Label>
        <Input
          id="file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isUploading}
          required
        />
        <p className="text-sm text-muted-foreground">
          Upload a CSV file with headers. The first column will be used as the term identifier.
          Maximum file size is 5MB.
        </p>
      </div>
      <Button 
        type="submit" 
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Library
          </>
        )}
      </Button>
    </form>
  );
}