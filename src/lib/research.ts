import { searchYoutubeVideos, getVideoTranscripts, getApiLogs as getYoutubeApiLogs, clearApiLogs as clearYoutubeApiLogs } from './youtube';
import { searchPerplexity, getApiLogs as getPerplexityApiLogs, clearApiLogs as clearPerplexityApiLogs } from './perplexity';
import { analyzeYouTubeContent, generateFinalReport, generateComparisonReport, getApiLogs as getOpenAIApiLogs, clearApiLogs as clearOpenAIApiLogs } from './openai';
import type { Product, ProductReport, ResearchResults, FeatureSet, ApiLog } from '@/types/product';

interface FeatureImportance {
  veryImportant: string[];
  important: string[];
}

async function researchSingleProduct(
  product: Product,
  features: FeatureSet
): Promise<ProductReport> {
  const featureImportance: FeatureImportance = {
    veryImportant: features.veryImportant || [],
    important: features.important || [],
  };

  try {
    // Search YouTube videos
    const videos = await searchYoutubeVideos(product.name);
    
    // Get transcripts for all videos
    const transcripts = await getVideoTranscripts(videos.map(v => v.id));
    
    // Prepare video data for analysis
    const videoData = videos.map(video => ({
      id: video.id,
      transcript: transcripts[video.id] || '',
    }));

    // Analyze YouTube content
    const analyses = await analyzeYouTubeContent(
      product.name,
      featureImportance,
      videoData
    );

    // Update video results with analyses
    const youtubeResults = videos.map((video, index) => ({
      ...video,
      analysis: analyses[index] || '',
    }));

    // Get website and Reddit reviews using Perplexity
    const [websiteResults, redditResults] = await Promise.all([
      searchPerplexity(`${product.name} review`, false),
      searchPerplexity(`${product.name} review`, true),
    ]);

    // Generate final report
    const finalReport = await generateFinalReport(
      product.name,
      featureImportance,
      analyses,
      websiteResults,
      redditResults
    );

    return {
      productName: product.name,
      youtubeResults,
      websiteResults,
      redditResults,
      finalReport,
    };
  } catch (error) {
    // Collect all API logs
    const allLogs: ApiLog[] = [
      ...getYoutubeApiLogs(),
      ...getPerplexityApiLogs(),
      ...getOpenAIApiLogs(),
    ];

    // Add error to logs if it's not already included
    if (error instanceof Error) {
      allLogs.push({
        timestamp: new Date().toISOString(),
        type: 'research',
        endpoint: 'process',
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
    }

    const errorWithLogs = new Error(error instanceof Error ? error.message : 'Research failed');
    (errorWithLogs as any).logs = allLogs;
    throw errorWithLogs;
  }
}

export async function performResearch(
  productName: string,
  features: FeatureSet
): Promise<ResearchResults> {
  // Clear all API logs before starting
  clearYoutubeApiLogs();
  clearPerplexityApiLogs();
  clearOpenAIApiLogs();

  try {
    const report = await researchSingleProduct({ name: productName, features: [] }, features);
    return { reports: [report] };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    const errorWithLogs = new Error('Research failed');
    (errorWithLogs as any).logs = [
      ...getYoutubeApiLogs(),
      ...getPerplexityApiLogs(),
      ...getOpenAIApiLogs(),
    ];
    throw errorWithLogs;
  }
}

export async function performMultiProductResearch(
  products: Product[],
  features: FeatureSet
): Promise<ResearchResults> {
  // Clear all API logs before starting
  clearYoutubeApiLogs();
  clearPerplexityApiLogs();
  clearOpenAIApiLogs();

  try {
    const productList = products.filter(p => p.name !== 'Features');
    const reports = await Promise.all(
      productList.map(product => researchSingleProduct(product, features))
    );

    // Generate comparison report if there are multiple products
    let comparisonReport: string | undefined;
    if (reports.length > 1) {
      comparisonReport = await generateComparisonReport(
        reports.map(r => r.productName),
        features,
        reports.map(r => r.finalReport)
      );
    }

    return { reports, comparisonReport };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    const errorWithLogs = new Error('Research failed');
    (errorWithLogs as any).logs = [
      ...getYoutubeApiLogs(),
      ...getPerplexityApiLogs(),
      ...getOpenAIApiLogs(),
    ];
    throw errorWithLogs;
  }
}