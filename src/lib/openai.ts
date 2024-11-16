import OpenAI from 'openai';
import type { ProductInfo, ProductComparison, ProductRecommendations, ComparisonReport } from '@/types/product';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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

// Helper function to handle OpenAI API errors
function handleOpenAIError(error: any): never {
  if (error.error?.type === 'insufficient_quota') {
    throw new Error(
      'API quota exceeded. Please check your OpenAI API key and billing status.'
    );
  }
  if (error.status === 429) {
    throw new Error(
      'Too many requests. Please wait a moment before trying again.'
    );
  }
  throw new Error(
    error.error?.message || error.message || 'An unexpected error occurred'
  );
}

const productInfoFunction = {
  name: 'get_product_info',
  description: 'Provides detailed product information with features in Title Case format',
  parameters: {
    type: 'object',
    properties: {
      productName: {
        type: 'string',
        description: 'The name of the product'
      },
      considerations: {
        type: 'array',
        description: 'A list of key-value pairs representing product considerations. Keys MUST be in Title Case format.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'The feature name in Title Case format (e.g., "Battery Life", "Image Quality")'
            },
            value: {
              type: 'string',
              description: 'The details or description of the feature'
            }
          },
          required: ['key', 'value']
        },
        minItems: 6,
        maxItems: 6
      }
    },
    required: ['productName', 'considerations']
  }
};

const compareProductsFunction = {
  name: 'get_product_comparisons',
  description: 'Provides comparison information for a product and its alternatives',
  parameters: {
    type: 'object',
    properties: {
      mainProduct: {
        type: 'string',
        description: 'The main product being researched',
      },
      alternatives: {
        type: 'array',
        description: 'List of alternative products',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the alternative product',
            },
            considerations: {
              type: 'array',
              description: 'Key considerations for this product',
              items: {
                type: 'object',
                properties: {
                  key: {
                    type: 'string',
                    description: 'The type of consideration',
                  },
                  value: {
                    type: 'string',
                    description: 'The details of the consideration',
                  },
                },
                required: ['key', 'value'],
              },
            },
          },
          required: ['name', 'considerations'],
        },
      },
    },
    required: ['mainProduct', 'alternatives'],
  },
};

const recommendProductsFunction = {
  name: 'get_product_recommendations',
  description: 'Provides product recommendations based on user requirements',
  parameters: {
    type: 'object',
    properties: {
      recommendations: {
        type: 'array',
        description: 'List of recommended products',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the recommended product',
            },
            considerations: {
              type: 'array',
              description: 'Key considerations for this product',
              items: {
                type: 'object',
                properties: {
                  key: {
                    type: 'string',
                    description: 'The type of consideration',
                  },
                  value: {
                    type: 'string',
                    description: 'The details of the consideration',
                  },
                },
                required: ['key', 'value'],
              },
            },
          },
          required: ['name', 'considerations'],
        },
      },
    },
    required: ['recommendations'],
  },
};

export async function fetchProductInfo(productName: string): Promise<ProductInfo> {
  const timestamp = new Date().toISOString();

  try {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      request: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer [HIDDEN]',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides detailed product information and recommendations. Your text output should always be in Title Case',
            },
            {
              role: 'user',
              content: `Provide a feature list for "${productName}". Include the top 6 most meaningful and relevant attributes (features) and their descriptions.

          Each feature name MUST be in Title Case format (e.g., "Battery Life", "Image Quality", "Build Quality").
          
          Example outputs:
          - Laptop: "Processing Power", "Battery Life", "Display Quality", "Build Quality", "Port Selection", "Keyboard Feel"
          - Camera: "Image Quality", "Autofocus System", "Low Light Performance", "Build Quality", "Battery Life", "Video Capabilities"
          - Headphones: "Sound Quality", "Noise Cancellation", "Comfort Level", "Battery Life", "Build Quality", "Wireless Range"
          
          Requirements:
          1. Each feature MUST be in Title Case
          2. Features should be specific and meaningful
          3. Focus on the most important aspects of ${productName}
          4. Avoid generic terms
          5. Each feature should be unique
          6. Exactly 6 features required`,
            }
          ],
          functions: [productInfoFunction],
          function_call: { name: 'get_product_info' }
        }
      }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides detailed product information and recommendations. Your text output should always be in Title Case',
        },
        {
          role: 'user',
          content: `Provide a feature list for "${productName}". Include the top 6 most meaningful and relevant attributes (features) and their descriptions.

          Each feature name MUST be in Title Case format (e.g., "Battery Life", "Image Quality", "Build Quality").
          
          Example outputs:
          - Laptop: "Processing Power", "Battery Life", "Display Quality", "Build Quality", "Port Selection", "Keyboard Feel"
          - Camera: "Image Quality", "Autofocus System", "Low Light Performance", "Build Quality", "Battery Life", "Video Capabilities"
          - Headphones: "Sound Quality", "Noise Cancellation", "Comfort Level", "Battery Life", "Build Quality", "Wireless Range"
          
          Requirements:
          1. Each feature MUST be in Title Case
          2. Features should be specific and meaningful
          3. Focus on the most important aspects of ${productName}
          4. Avoid generic terms
          5. Each feature should be unique
          6. Exactly 6 features required`,
        },
      ],
      functions: [productInfoFunction],
      function_call: { name: 'get_product_info' },
      temperature: 0.7,
    });

    const message = response.choices[0]?.message;
    if (!message || !message.function_call?.arguments) {
      throw new Error('Invalid response format from OpenAI');
    }

    const data = JSON.parse(message.function_call.arguments);
    if (!data.productName || !Array.isArray(data.considerations)) {
      throw new Error('Invalid data structure in OpenAI response');
    }

    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      response: {
        status: 200,
        body: `Received product info for ${data.productName}. ${data.considerations.length} considerations found.`
      }
    });

    return data;
  } catch (error) {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    console.error('Error fetching product information:', error);
    handleOpenAIError(error);
  }
}

export async function fetchProductComparisons(productName: string): Promise<ProductComparison> {
  const timestamp = new Date().toISOString();

  try {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      request: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer [HIDDEN]',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides detailed product comparisons.',
            },
            {
              role: 'user',
              content: `A user is considering buying "${productName}". Suggest the top 3 most relevant alternative products that serve a similar purpose.`,
            }
          ],
          functions: [compareProductsFunction],
          function_call: { name: 'get_product_comparisons' }
        }
      }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides detailed product comparisons.',
        },
        {
          role: 'user',
          content: `A user is considering buying "${productName}". Suggest the top 3 most relevant alternative products that serve a similar purpose.`,
        },
      ],
      functions: [compareProductsFunction],
      function_call: { name: 'get_product_comparisons' },
      temperature: 0.7,
    });

    const message = response.choices[0]?.message;
    if (!message || !message.function_call?.arguments) {
      throw new Error('Invalid response format from OpenAI');
    }

    const data = JSON.parse(message.function_call.arguments);
    if (!data.mainProduct || !Array.isArray(data.alternatives)) {
      throw new Error('Invalid data structure in OpenAI response');
    }

    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      response: {
        status: 200,
        body: `Received comparisons for ${data.mainProduct}. Found ${data.alternatives.length} alternatives.`
      }
    });

    return data;
  } catch (error) {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    console.error('Error fetching product comparisons:', error);
    handleOpenAIError(error);
  }
}

export async function fetchProductRecommendations(userDescription: string): Promise<ProductRecommendations> {
  const timestamp = new Date().toISOString();

  try {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      request: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer [HIDDEN]',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides product recommendations based on user needs.',
            },
            {
              role: 'user',
              content: `Based on the following description, suggest the top 4 most relevant products that meet the user's needs: "${userDescription}"`,
            }
          ],
          functions: [recommendProductsFunction],
          function_call: { name: 'get_product_recommendations' }
        }
      }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides product recommendations based on user needs.',
        },
        {
          role: 'user',
          content: `Based on the following description, suggest the top 4 most relevant products that meet the user's needs: "${userDescription}"`,
        },
      ],
      functions: [recommendProductsFunction],
      function_call: { name: 'get_product_recommendations' },
      temperature: 0.7,
    });

    const message = response.choices[0]?.message;
    if (!message || !message.function_call?.arguments) {
      throw new Error('Invalid response format from OpenAI');
    }

    const data = JSON.parse(message.function_call.arguments);
    if (!Array.isArray(data.recommendations)) {
      throw new Error('Invalid data structure in OpenAI response');
    }

    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      response: {
        status: 200,
        body: `Received ${data.recommendations.length} recommendations based on user description.`
      }
    });

    return data;
  } catch (error) {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    console.error('Error fetching product recommendations:', error);
    handleOpenAIError(error);
  }
}

export async function analyzeYouTubeContent(
  product: string,
  features: { veryImportant: string[]; important: string[] },
  videos: Array<{ id: string; transcript: string }>
): Promise<string[]> {
  const timestamp = new Date().toISOString();

  try {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      request: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer [HIDDEN]',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that analyzes product reviews from YouTube videos.',
            },
            {
              role: 'user',
              content: `Analyze ${videos.length} YouTube transcripts about ${product}.`
            }
          ]
        }
      }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes product reviews from YouTube videos. Format your response in Markdown.',
        },
        {
          role: 'user',
          content: `Analyze these YouTube transcripts about ${product}. For each video:
            1) Generate a small summary of the video/content
            2) Analyze how the product performs regarding these very important features: ${features.veryImportant.join(', ')}
            3) Analyze how the product performs regarding these important features: ${features.important.join(', ')}
            4) List important considerations not included above
            5) List complaints or limitations

            If information isn't provided for any given variable, output null.

            ${videos.map((v, i) => `Transcript of video ${i + 1}: ${v.transcript}`).join('\n\n')}

            Important: avoid generalized praise for the product. This needs to be a report that dives into the specifics.
            
            Format the response in Markdown with appropriate headers and bullet points.`,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid response format from OpenAI');
    }

    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      response: {
        status: 200,
        body: `Generated analysis for ${videos.length} videos. Sample: ${content.slice(0, 100)}...`
      }
    });

    return videos.map(() => content);
  } catch (error) {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    console.error('OpenAI YouTube Analysis Error:', error);
    handleOpenAIError(error);
  }
}

export async function generateFinalReport(
  product: string,
  features: { veryImportant: string[]; important: string[] },
  youtubeAnalysis: string[],
  websiteResults: string,
  redditResults: string
): Promise<string> {
  const timestamp = new Date().toISOString();

  try {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      request: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer [HIDDEN]',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates comprehensive product research reports.',
            },
            {
              role: 'user',
              content: `Generate a final report for ${product} based on analyzed data.`
            }
          ],
          response_format: { type: "json_object" }
        }
      }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates comprehensive product research reports. Your response must be in valid JSON format with the exact structure specified in the user prompt.',
        },
        {
          role: 'user',
          content: `Generate a JSON report for ${product} with this exact structure:
{
  "introduction": "Brief product introduction",
  "features": [
    {
      "name": "Feature name",
      "importance": "Very Important or Important",
      "analysis": "Detailed analysis"
    }
  ],
  "limitations": ["List of limitations"],
  "conclusion": "Final summary"
}

Very Important Features: ${features.veryImportant.join(', ')}
Important Features: ${features.important.join(', ')}

Research Data:
YouTube Analysis: ${youtubeAnalysis.join('\n')}
Website Analysis: ${websiteResults}
Reddit Analysis: ${redditResults}

Remember:
1. Response MUST be valid JSON
2. Include ALL features listed above
3. Mark importance correctly based on the feature lists
4. Provide detailed analysis for each feature
5. DO NOT add any markdown or text outside the JSON structure`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const parsed = JSON.parse(content);
      if (!parsed.introduction || !Array.isArray(parsed.features) || !Array.isArray(parsed.limitations) || !parsed.conclusion) {
        throw new Error('Missing required fields in JSON response');
      }

      addApiLog({
        timestamp,
        type: 'openai',
        endpoint: 'chat/completions',
        response: {
          status: 200,
          body: `Generated final report with ${parsed.features.length} features and ${parsed.limitations.length} limitations.`
        }
      });

      return content;
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid JSON format in response');
    }
  } catch (error) {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    console.error('OpenAI Report Generation Error:', error);
    handleOpenAIError(error);
  }
}

export async function generateComparisonReport(
  products: string[],
  features: { veryImportant: string[]; important: string[] },
  productReports: string[]
): Promise<string> {
  const timestamp = new Date().toISOString();

  try {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      request: {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer [HIDDEN]',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates comprehensive product research reports.',
            },
            {
              role: 'user',
              content: 'Generate a comparison report based on analyzed data.'
            }
          ],
          response_format: { type: "json_object" }
        }
      }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates comprehensive product research reports. Your response must be in valid JSON format with the exact structure specified in the user prompt.',
        },
        {
          role: 'user',
          content: `Your task is:
1 - Decide what product is best for the user, given the information provided in individual reports, and given the user's preferences towards specific features.
2 - Produce this report in JSON.

For the second task, generate a JSON report that aggregates the information of all these products:
${products.join(', ')}

These are the features the user cares about:
Very Important Features: ${features.veryImportant.join(', ')}
Important Features: ${features.important.join(', ')}

The report should have this exact structure:
{
  "introduction": "Brief product introduction",
  "recommendation": "Recommended product choice, given which one fits best for the user given their feature requirements and taking into account limitations. Only output the product name",
  "reasoning": "Explain why this product is the best for the user, given which one fits best for the user given their feature requirements and taking into account limitations",
  "features": [
    {
      "name": "Feature name",
      "importance": "Very Important or Important",
      "analysis": "Describe how each product fares in relationship to this feature"
    }
  ],
  "limitations": ["List of limitations"],
  "conclusion": "Final summary"
}

This should be based on the reports of previous products:
${productReports.map((report, index) => `${products[index]}: ${report}`).join('\n\n')}

Remember:
1. Response MUST be valid JSON
2. Include ALL features listed above
3. Mark importance correctly based on the feature lists
4. Provide detailed analysis for each feature
5. DO NOT add any markdown or text outside the JSON structure`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const parsed = JSON.parse(content);
      if (!parsed.introduction || !parsed.recommendation || !parsed.reasoning || 
          !Array.isArray(parsed.features) || !Array.isArray(parsed.limitations) || 
          !parsed.conclusion) {
        throw new Error('Missing required fields in JSON response');
      }

      addApiLog({
        timestamp,
        type: 'openai',
        endpoint: 'chat/completions',
        response: {
          status: 200,
          body: `Generated comparison report comparing ${products.length} products.`
        }
      });

      return content;
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid JSON format in response');
    }
  } catch (error) {
    addApiLog({
      timestamp,
      type: 'openai',
      endpoint: 'chat/completions',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    console.error('OpenAI Comparison Report Generation Error:', error);
    handleOpenAIError(error);
  }
}