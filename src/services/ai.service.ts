import axios from 'axios';

export const generateAIInsights = async (prompt: string): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing from environment variables');
  }

  console.log(`[AI Service] Generating insights using model: ${model}`);
  const startTime = Date.now();

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[AI Service] Request successful. Duration: ${duration}ms`);

    if (
      response.data &&
      response.data.choices &&
      response.data.choices.length > 0 &&
      response.data.choices[0].message
    ) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Malformed response from OpenRouter');
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error(`[AI Service] Request failed. Duration: ${duration}ms. Error: ${errorMessage}`);
    throw new Error(errorMessage);
  }
};
