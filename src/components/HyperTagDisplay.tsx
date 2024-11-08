import { useState, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { HyperTagDialog } from './HyperTagDialog';
import type { TaskHyperTag } from '@/types/library';

interface HyperTagDisplayProps {
  tag: TaskHyperTag;
}

export const HyperTagDisplay = memo(function HyperTagDisplay({ tag }: HyperTagDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Badge
        variant="outline"
        className="cursor-pointer hover:bg-accent"
        onClick={() => setShowDetails(true)}
      >
        {tag.term}
      </Badge>

      <HyperTagDialog
        tag={tag}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
});