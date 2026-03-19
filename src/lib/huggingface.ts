export type HuggingFaceResponse = {
  generated_text?: string;
  error?: string;
};

const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'tiiuae/falcon-7b-instruct';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

export async function callHuggingFace(prompt: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing HUGGINGFACE_API_KEY environment variable');
  }

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.2,
        top_p: 0.9,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HuggingFace request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as HuggingFaceResponse;
  if (data.error) throw new Error(data.error);

  return data;
}
