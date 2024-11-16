import { X, ThumbsUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Feature, Importance } from "@/types/product";

interface FeatureItemProps {
  feature: Feature;
  onImportanceChange: (importance: Importance) => void;
}

export function FeatureItem({ feature, onImportanceChange }: FeatureItemProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 bg-background p-3 sm:p-4 rounded-lg animate-in fade-in duration-300">
      <span className="flex-grow font-medium text-sm sm:text-base break-words">{feature.name}</span>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          variant={feature.importance === 'Not important' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onImportanceChange('Not important')}
          aria-label="Mark as not important"
          className="flex-1 sm:flex-none"
        >
          <X className="h-4 w-4" />
          <span className="ml-1 sm:hidden">Not Important</span>
        </Button>
        <Button
          variant={feature.importance === 'Important' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onImportanceChange('Important')}
          aria-label="Mark as important"
          className="flex-1 sm:flex-none"
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="ml-1 sm:hidden">Important</span>
        </Button>
        <Button
          variant={feature.importance === 'Very Important' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onImportanceChange('Very Important')}
          aria-label="Mark as very important"
          className="flex-1 sm:flex-none"
        >
          <Star className="h-4 w-4" />
          <span className="ml-1 sm:hidden">Very Important</span>
        </Button>
      </div>
    </div>
  );
}