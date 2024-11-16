import { searchYoutubeVideos, getVideoTranscripts, getApiLogs as getYoutubeApiLogs, clearApiLogs as clearYoutubeApiLogs } from './youtube';
import { searchPerplexity, getApiLogs as getPerplexityApiLogs, clearApiLogs as clearPerplexityApiLogs } from './perplexity';
import { analyzeYouTubeContent, generateFinalReport, generateComparisonReport, getApiLogs as getOpenAIApiLogs, clearApiLogs as clearOpenAIApiLogs } from './openai';
import type { Product, ProductReport, ResearchResults, FeatureSet, ApiLog, VideoResult } from '@/types/product';

interface FeatureImportance {
  veryImportant: string[];
  important: string[];
}

interface ResearchCache {
  [key: string]: {
    videos?: VideoResult[];
    transcripts?: { [key: string]: string };
    websiteResults?: string;
    redditResults?: string;
  };
}

const researchCache: ResearchCache = {};

async function prefetchProductData(productName: string): Promise<void> {
  if (researchCache[productName]) return;

  researchCache[productName] = {};

  try {
    // Start all initial API calls in parallel
    const [videos, websiteResults, redditResults] = await Promise.allSettled([
      searchYoutubeVideos(productName),
      searchPerplexity(`${productName} review`, false),
      searchPerplexity(`${productName} review`, true)
    ]);

    if (videos.status === 'fulfilled') {
      researchCache[productName].videos = videos.value;
      // Start fetching transcripts as soon as we have videos
      try {
        const transcripts = await getVideoTranscripts(videos.value.map(v => v.id));
        researchCache[productName].transcripts = transcripts;
      } catch (error) {
        console.warn('Failed to fetch transcripts:', error);
      }
    }

    if (websiteResults.status === 'fulfilled') {
      researchCache[productName].websiteResults = websiteResults.value;
    }

    if (redditResults.status === 'fulfilled') {
      researchCache[productName].redditResults = redditResults.value;
    }
  } catch (error) {
    console.warn('Error during prefetch:', error);
  }
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
    const cachedData = researchCache[product.name] || {};
    
    // Use cached data or fetch if not available
    const [videos, websiteResults, redditResults] = await Promise.all([
      cachedData.videos || searchYoutubeVideos(product.name),
      cachedData.websiteResults || searchPerplexity(`${product.name} review`, false),
      cachedData.redditResults || searchPerplexity(`${product.name} review`, true)
    ]);

    // Use cached transcripts or fetch if not available
    const transcripts = cachedData.transcripts || await getVideoTranscripts(videos.map(v => v.id));

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
    const allLogs: ApiLog[] = [
      ...getYoutubeApiLogs(),
      ...getPerplexityApiLogs(),
      ...getOpenAIApiLogs(),
    ];

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
  clearYoutubeApiLogs();
  clearPerplexityApiLogs();
  clearOpenAIApiLogs();

  try {
    const productList = products.filter(p => p.name !== 'Features');
    
    // Start prefetching data for all products in parallel
    await Promise.all(productList.map(product => prefetchProductData(product.name)));

    // Process all products in parallel
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

// Export for component use
export { prefetchProductData };