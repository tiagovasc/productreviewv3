import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResearchResults } from "@/types/product";
import { useState } from "react";

interface StepFiveProps {
  research: ResearchResults;
  onBack: () => void;
}

interface ParsedReport {
  introduction: string;
  features: Array<{
    name: string;
    importance: string;
    analysis: string;
  }>;
  limitations: string[];
  conclusion: string;
}

interface ParsedComparisonReport extends ParsedReport {
  recommendation: string;
  reasoning: string;
}

const FinalReport = ({ content }: { content: string }) => {
  try {
    const report: ParsedReport = JSON.parse(content);
    
    return (
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 py-4 sm:py-8">
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Introduction</h2>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{report.introduction}</p>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Features Analysis</h2>
          <div className="space-y-6 sm:space-y-8">
            {report.features.map((feature, index) => (
              <div key={index} className="space-y-2 sm:space-y-3">
                <h3 className="text-xl sm:text-2xl font-semibold flex flex-wrap items-center gap-2 sm:gap-3">
                  {feature.name}
                  <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                    feature.importance === 'Very Important' 
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {feature.importance}
                  </span>
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{feature.analysis}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Limitations</h2>
          <ul className="list-disc pl-4 sm:pl-6 space-y-2 sm:space-y-3">
            {report.limitations.map((limitation, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{limitation}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Conclusion</h2>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{report.conclusion}</p>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error parsing report:', error);
    return <div className="text-red-500">Error parsing report data</div>;
  }
};

const ComparisonReport = ({ content }: { content: string }) => {
  try {
    const report: ParsedComparisonReport = JSON.parse(content);
    
    return (
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 py-4 sm:py-8">
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Introduction</h2>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{report.introduction}</p>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Recommendation</h2>
          <div className="bg-primary/10 p-4 sm:p-6 rounded-lg">
            <p className="text-xl sm:text-2xl font-semibold text-primary mb-3 sm:mb-4">{report.recommendation}</p>
            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{report.reasoning}</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Features Comparison</h2>
          <div className="space-y-6 sm:space-y-8">
            {report.features.map((feature, index) => (
              <div key={index} className="space-y-2 sm:space-y-3">
                <h3 className="text-xl sm:text-2xl font-semibold flex flex-wrap items-center gap-2 sm:gap-3">
                  {feature.name}
                  <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                    feature.importance === 'Very Important' 
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {feature.importance}
                  </span>
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{feature.analysis}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Limitations</h2>
          <ul className="list-disc pl-4 sm:pl-6 space-y-2 sm:space-y-3">
            {report.limitations.map((limitation, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{limitation}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Conclusion</h2>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">{report.conclusion}</p>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error parsing comparison report:', error);
    return <div className="text-red-500">Error parsing comparison report data</div>;
  }
};

export function StepFive({ research, onBack }: StepFiveProps) {
  const [selectedProduct, setSelectedProduct] = useState(research.reports[0].productName);
  const currentReport = research.reports.find(r => r.productName === selectedProduct)!;
  const isMultiProduct = research.reports.length > 1;

  // Single product mode
  if (!isMultiProduct) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="min-h-[calc(100vh-200px)]">
          <FinalReport content={currentReport.finalReport} />
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-4 max-w-4xl mx-auto py-6 sm:py-8">
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button className="w-full sm:w-auto flex items-center justify-center" onClick={() => window.location.reload()}>
            Start New Research
          </Button>
        </div>
      </div>
    );
  }

  // Multi product mode
  return (
    <div className="animate-in fade-in duration-500">
      <Tabs defaultValue="recommendation" className="w-full">
        <TabsList className="flex justify-center mb-6 sm:mb-8 w-full overflow-x-auto">
          <TabsTrigger value="recommendation" className="flex-1">Recommendation</TabsTrigger>
          <TabsTrigger value="products" className="flex-1">Product Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendation" className="min-h-[calc(100vh-200px)]">
          {research.comparisonReport && (
            <ComparisonReport content={research.comparisonReport} />
          )}
        </TabsContent>

        <TabsContent value="products">
          <div className="flex justify-center mb-6 sm:mb-8 px-4">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select product to view" />
              </SelectTrigger>
              <SelectContent>
                {research.reports.map((report) => (
                  <SelectItem key={report.productName} value={report.productName}>
                    {report.productName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-h-[calc(100vh-300px)]">
            <FinalReport content={currentReport.finalReport} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row justify-between gap-4 max-w-4xl mx-auto py-6 sm:py-8">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button className="w-full sm:w-auto flex items-center justify-center" onClick={() => window.location.reload()}>
          Start New Research
        </Button>
      </div>
    </div>
  );
}