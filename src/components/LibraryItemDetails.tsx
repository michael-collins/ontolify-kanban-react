import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLibraryItems } from '@/hooks/use-library-items';
import type { LibraryFile } from '@/types/library';

interface LibraryItemDetailsProps {
  library: LibraryFile;
}

export function LibraryItemDetails({ library }: LibraryItemDetailsProps) {
  const { items } = useLibraryItems([library]);

  const libraryItems = items.filter(item => item.libraryFileId === library.id);
  const fields = library.fields || [];

  // Convert field names to display labels
  const fieldLabels = fields.map(field => 
    field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{library.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                {fieldLabels.map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {libraryItems.map((item) => (
                <TableRow key={item.id}>
                  {fields.map((field) => (
                    <TableCell key={field}>{item[field]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}