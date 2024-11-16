import { useEffect, useState } from 'react';

const MESSAGES = [
  "🔍 Preparing your search.",
  "📚 Looking for articles...",
  "📰 Articles found!",
  "👀 Reading articles...",
  "🔎 Checking Reddit threads...",
  "🧵 Reddit threads found!",
  "📖 Reading Reddit threads...",
  "🎥 Searching for YouTube videos...",
  "🎬 Videos found!",
  "📑 Reading video transcripts...",
  "💾 Downloading information...",
  "📝 Putting everything together...",
  "📊 Creating your report...",
  "⌛ Almost done, hang on a little longer!"
];

const TIME_WAIT_1 = 10000; 

export function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < MESSAGES.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, TIME_WAIT_1);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-primary">
          ❌ Hours of manual research<br />
          ✅ Owl AI Report in 2 minutes
        </h3>
      </div>
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
      <div className="text-center space-y-4">
        <p className="text-lg font-medium animate-pulse">
          {MESSAGES[currentStep]}
        </p>
        <div className="flex justify-center space-x-2">
          {MESSAGES.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === currentStep ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}