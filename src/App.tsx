import { useState } from 'react';
import { performResearch, performMultiProductResearch } from './lib/research';
import type { Option, Step, Product, MainOption, ResearchResults, ResearchError, ResearchType } from './types/product';
import { Button } from "@/components/ui/button";
import { StepOne } from './components/ProductReviewer/StepOne';
import { StepOnePointTwoFive } from './components/ProductReviewer/StepOnePointTwoFive';
import { StepOnePointFive } from './components/ProductReviewer/StepOnePointFive';
import { StepTwo } from './components/ProductReviewer/StepTwo';
import { StepThree } from './components/ProductReviewer/StepThree';
import { StepFive } from './components/ProductReviewer/StepFive';
import { ErrorDialog } from './components/ui/error-dialog';
import { fetchProductInfo, fetchProductComparisons, fetchProductRecommendations } from './lib/openai';

function App() {
  const [step, setStep] = useState<Step>(1);
  const [mainOption, setMainOption] = useState<MainOption>(null);
  const [option, setOption] = useState<Option>(null);
  const [input, setInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ResearchError | null>(null);
  const [newFeature, setNewFeature] = useState('');
  const [research, setResearch] = useState<ResearchResults | null>(null);
  const [researchType, setResearchType] = useState<ResearchType>(null);

  const resetApp = () => {
    setStep(1);
    setMainOption(null);
    setOption(null);
    setInput('');
    setProducts([]);
    setLoading(false);
    setError(null);
    setNewFeature('');
    setResearch(null);
    setResearchType(null);
  };

  const handleMainOptionSelect = (selectedOption: MainOption) => {
    setMainOption(selectedOption);
    if (selectedOption === 'known') {
      setStep(1.25);
    } else {
      setStep(2);
      setOption('recommend');
    }
  };

  const handleResearchTypeSelect = (type: ResearchType) => {
    setResearchType(type);
    setStep(1.5);
  };

  const handleOptionSelect = async (selectedOption: Option) => {
    setOption(selectedOption);
    setLoading(true);
    setError(null);

    try {
      switch (selectedOption) {
        case 'research': {
          const productInfo = await fetchProductInfo(input);
          const features = extractFeatures(productInfo.considerations);
          setProducts([{ name: input, features }]);
          break;
        }
        case 'compare': {
          const comparison = await fetchProductComparisons(input);
          const features = extractFeatures(comparison.alternatives[0].considerations);
          const allProducts = [
            { name: comparison.mainProduct, features: [] },
            ...comparison.alternatives.map(alt => ({ name: alt.name, features: [] })),
          ];
          setProducts([...allProducts, { name: 'Features', features }]);
          break;
        }
        case 'recommend': {
          const recommendations = await fetchProductRecommendations(input);
          const features = extractFeatures(recommendations.recommendations[0].considerations);
          const recommendedProducts = recommendations.recommendations.map(rec => ({
            name: rec.name,
            features: [],
          }));
          setProducts([...recommendedProducts, { name: 'Features', features }]);
          break;
        }
      }
      setStep(3);
    } catch (err) {
      const errorObj = err as Error;
      setError({
        message: errorObj.message || 'An unknown error occurred',
        logs: (errorObj as any).logs || []
      });
    } finally {
      setLoading(false);
    }
  };

  const extractFeatures = (considerations: Array<{ key: string; value: string }>) => {
    return considerations.map((consideration, index) => ({
      id: Date.now() + index,
      name: consideration.key,
      importance: 'Important' as const,
    }));
  };

  const handleBack = () => {
    if (step === 1.5) {
      setStep(1.25);
      setOption(null);
      setInput('');
    } else if (step === 1.25) {
      setStep(1);
      setMainOption(null);
      setResearchType(null);
    } else if (step === 2) {
      setStep(1);
      setOption(null);
      setInput('');
      setMainOption(null);
      setProducts([]);
    } else if (step === 3) {
      if (mainOption === 'known') {
        setStep(1.5);
      } else {
        setStep(2);
      }
      setProducts([]);
    } else if (step === 5) {
      setStep(3);
      setResearch(null);
    }
  };

  const handleImportanceChange = (productIndex: number, featureId: number, importance: string) => {
    setProducts(prevProducts => prevProducts.map((product, index) => 
      index === productIndex
        ? {
            ...product,
            features: product.features.map(feature => 
              feature.id === featureId ? { ...feature, importance } : feature
            )
          }
        : product
    ));
  };

  const addNewFeature = (productIndex: number) => {
    if (newFeature.trim()) {
      setProducts(prevProducts => prevProducts.map((product, index) => 
        index === productIndex
          ? {
              ...product,
              features: [...product.features, { 
                id: Date.now(), 
                name: newFeature.trim(), 
                importance: 'Important' 
              }]
            }
          : product
      ));
      setNewFeature('');
    }
  };

  const handleProductsChange = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
  };

  const startResearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const featuresProduct = products[products.length - 1];
      const features = featuresProduct.features.reduce(
        (acc, feature) => {
          if (feature.importance === 'Very Important') {
            acc.veryImportant.push(feature.name);
          } else if (feature.importance === 'Important') {
            acc.important.push(feature.name);
          }
          return acc;
        },
        { veryImportant: [] as string[], important: [] as string[] }
      );

      const results = option === 'research'
        ? await performResearch(products[0].name, features)
        : await performMultiProductResearch(products, features);

      setResearch(results);
      setStep(5);
    } catch (err) {
      const errorObj = err as Error;
      setError({
        message: errorObj.message || 'An unknown error occurred',
        logs: (errorObj as any).logs || []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-12 cursor-pointer hover:opacity-90 transition-all duration-200"
            onClick={resetApp}
          >
            <img 
              src="https://i.imgur.com/x1ybuv6.png"
              alt="Owl AI Reviewer" 
              className="w-16 h-16 sm:w-24 sm:h-24"
              style={{ objectFit: 'contain' }}
            />
            <h1 className="text-2xl sm:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              Owl AI Reviewer
            </h1>
          </div>
          
          <div className="w-full max-w-3xl">
            <div className="bg-card shadow-lg rounded-2xl p-4 sm:p-8 backdrop-blur-sm bg-opacity-95">
              {error && (
                <div className="mb-4 sm:mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-center text-sm sm:text-base">
                    Research failed. Click <ErrorDialog logs={error.logs} /> for details.
                  </p>
                </div>
              )}

              {step === 1 && (
                <StepOne onOptionSelect={handleMainOptionSelect} />
              )}

              {step === 1.25 && (
                <StepOnePointTwoFive
                  onResearchTypeSelect={handleResearchTypeSelect}
                  onBack={handleBack}
                />
              )}

              {step === 1.5 && (
                <StepOnePointFive
                  input={input}
                  loading={loading}
                  onInputChange={setInput}
                  onOptionSelect={handleOptionSelect}
                  onBack={handleBack}
                  researchType={researchType}
                />
              )}

              {step === 2 && (
                <StepTwo
                  option={option}
                  input={input}
                  loading={loading}
                  onInputChange={setInput}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleOptionSelect('recommend');
                  }}
                  onBack={handleBack}
                />
              )}

              {step === 3 && (
                <StepThree
                  products={products}
                  option={option}
                  newFeature={newFeature}
                  onNewFeatureChange={setNewFeature}
                  onAddFeature={addNewFeature}
                  onImportanceChange={handleImportanceChange}
                  onBack={handleBack}
                  onContinue={startResearch}
                  loading={loading}
                  onProductsChange={handleProductsChange}
                />
              )}

              {step === 5 && research && (
                <StepFive
                  research={research}
                  onBack={handleBack}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <footer className="py-4 text-center text-xs sm:text-sm text-muted-foreground">
        made by <a href="https://www.tiagov.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dazai</a>
      </footer>
    </div>
  );
}

export default App;