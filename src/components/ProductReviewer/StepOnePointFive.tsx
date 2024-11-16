import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { prefetchProductData } from "@/lib/research";
import type { Option, ResearchType } from "@/types/product";

interface StepOnePointFiveProps {
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onOptionSelect: (option: Option) => void;
  onBack: () => void;
  researchType: ResearchType;
}

export function StepOnePointFive({ 
  input, 
  loading, 
  onInputChange, 
  onOptionSelect,
  onBack,
  researchType
}: StepOnePointFiveProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOptionSelect(researchType === 'single' ? 'research' : 'compare');
  };

  // Start prefetching data as soon as the user types
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (input.trim()) {
        prefetchProductData(input.trim());
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(debounceTimer);
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
      <Input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Enter product name"
        className="w-full"
      />
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={onBack} type="button">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={!input.trim() || loading}>
          {loading ? 'Loading...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}