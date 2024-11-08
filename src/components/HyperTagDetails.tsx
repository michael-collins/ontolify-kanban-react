import { useMemo } from 'react';
import { useLibraryContext } from '@/contexts/LibraryContext';
import type { TaskHyperTag } from '@/types/library';

interface HyperTagDetailsProps {
  tag: TaskHyperTag;
}

export function HyperTagDetails({ tag }: HyperTagDetailsProps) {
  const { items } = useLibraryContext();
  
  const details = useMemo(() => {
    const libraryItem = items.find(item => 
      item.id === tag.libraryItemId && 
      item.libraryFileId === tag.libraryFileId
    );

    if (!libraryItem) return null;

    // Get all fields except the ones we don't want to display
    const excludedFields = ['id', 'term', 'libraryFileId'];
    const fields = Object.entries(libraryItem)
      .filter(([key]) => !excludedFields.includes(key))
      .filter(([_, value]) => value && String(value).trim() !== '')
      .map(([key, value]) => ({
        label: key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: String(value)
      }));

    return fields;
  }, [items, tag.libraryItemId, tag.libraryFileId]);

  if (!details || details.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No additional details available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {details.map(({ label, value }) => (
        <div key={label} className="space-y-1.5">
          <h4 className="text-sm font-semibold text-foreground">{label}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}