import { VideoResult } from '@/types/product';

const API_URL = 'https://flasktest-production-b8ba.up.railway.app/run';
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

let apiLogs: any[] = [];

export function getApiLogs() {
  return apiLogs;
}

export function clearApiLogs() {
  apiLogs = [];
}

function addApiLog(log: any) {
  apiLogs.push(log);
  console.log(`API Log [${log.type}]:`, log);
}

export async function searchYoutubeVideos(query: string): Promise<VideoResult[]> {
  const timestamp = new Date().toISOString();
  const requestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query + ' review'
  )}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`;

  try {
    addApiLog({
      timestamp,
      type: 'youtube',
      endpoint: 'search',
      request: {
        method: 'GET',
        headers: {},
        url: requestUrl.replace(YOUTUBE_API_KEY, '[HIDDEN]')
      }
    });

    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube videos: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid response format from YouTube API');
    }

    const results = data.items.map((item: any) => ({
      id: item.id?.videoId || '',
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      analysis: '',
    }));

    addApiLog({
      timestamp,
      type: 'youtube',
      endpoint: 'search',
      response: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: `Found ${results.length} videos. First video: ${results[0]?.title?.slice(0, 30)}...`
      }
    });

    return results;
  } catch (error) {
    addApiLog({
      timestamp,
      type: 'youtube',
      endpoint: 'search',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    throw error;
  }
}

interface TranscriptResponse {
  data: string | string[][];
  error?: string;
}

export async function getVideoTranscripts(videoIds: string[]): Promise<Record<string, string>> {
  if (!import.meta.env.VITE_API_KEY) {
    throw new Error('API key is not configured');
  }

  const timestamp = new Date().toISOString();
  const headers = {
    'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
    'Content-Type': 'application/json'
  };
  const videoUrls = videoIds.map(id => `https://www.youtube.com/watch?v=${id}`);
  const transcriptMap: Record<string, string> = {};

  try {
    // Process videos in smaller batches to avoid overwhelming the API
    const batchSize = 2;
    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batchVideoIds = videoIds.slice(i, i + batchSize);
      const batchUrls = batchVideoIds.map(id => `https://www.youtube.com/watch?v=${id}`);

      addApiLog({
        timestamp,
        type: 'youtube',
        endpoint: 'transcript',
        request: {
          method: 'POST',
          headers: {
            ...headers,
            'Authorization': 'Bearer [HIDDEN]'
          },
          body: { urls: batchUrls }
        }
      });

      try {
        const response = await fetch(`${API_URL}?clean_output=true`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ urls: batchUrls })
        });

        if (!response.ok) {
          console.warn(`Failed to fetch transcripts for batch ${i / batchSize + 1}, continuing with next batch`);
          continue;
        }

        const responseText = await response.text();
        let result: TranscriptResponse;

        try {
          // Try parsing as JSON first
          result = JSON.parse(responseText);
        } catch (e) {
          // If JSON parsing fails, treat it as a plain text response
          result = {
            data: responseText,
            error: undefined
          };
        }

        if (result.error) {
          console.warn(`Error in transcript batch ${i / batchSize + 1}: ${result.error}, continuing with next batch`);
          continue;
        }

        if (!result.data) {
          console.warn(`No transcript data received for batch ${i / batchSize + 1}, continuing with next batch`);
          continue;
        }

        // Handle the transcript data based on its type
        if (typeof result.data === 'string') {
          // If it's a single string, use it for all videos in the batch
          batchVideoIds.forEach((id) => {
            transcriptMap[id] = result.data as string;
          });
        } else if (Array.isArray(result.data)) {
          // If it's an array, join all parts with spaces
          const transcript = result.data
            .flat()
            .map(caption => Array.isArray(caption) ? caption[0] : caption)
            .join(' ');
          
          batchVideoIds.forEach((id) => {
            transcriptMap[id] = transcript;
          });
        }

        addApiLog({
          timestamp,
          type: 'youtube',
          endpoint: 'transcript',
          response: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: `Received transcripts for ${batchVideoIds.length} videos. Sample: ${
              Object.values(transcriptMap)[0]?.slice(0, 100)
            }...`
          }
        });

        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < videoIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn(`Error processing batch ${i / batchSize + 1}:`, error);
        addApiLog({
          timestamp,
          type: 'youtube',
          endpoint: 'transcript',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });
        continue;
      }
    }

    // If we got at least one transcript, consider it a success
    if (Object.keys(transcriptMap).length > 0) {
      return transcriptMap;
    }

    // If we got no transcripts at all, throw an error
    throw new Error('Failed to fetch any transcripts');
  } catch (error) {
    addApiLog({
      timestamp,
      type: 'youtube',
      endpoint: 'transcript',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    console.error('Error fetching transcripts:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch video transcripts');
  }
}