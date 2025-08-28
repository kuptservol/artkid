import * as FileSystem from 'expo-file-system';

type GenerateFromScribbleParams = {
  imageUri: string;
  prompt: string;
};

type ReplicateUploadResponse = {
  id: string;
  name: string;
  url: string;
};

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string | null;
};

const REPLICATE_API = 'https://api.replicate.com/v1';

async function uploadToReplicate(inputUri: string, apiToken: string): Promise<string> {
  const uploadUrl = `${REPLICATE_API}/files`;
  const upload = await FileSystem.uploadAsync(uploadUrl, inputUri, {
    httpMethod: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/octet-stream',
    },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (upload.status !== 200) {
    throw new Error(`Upload failed: ${upload.status} ${upload.body}`);
  }
  const parsed: ReplicateUploadResponse = JSON.parse(upload.body);
  if (!parsed?.url) throw new Error('Upload response missing URL');
  return parsed.url;
}

async function createPrediction(modelVersion: string, input: Record<string, unknown>, apiToken: string): Promise<ReplicatePrediction> {
  const res = await fetch(`${REPLICATE_API}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: modelVersion, input }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Prediction create failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as ReplicatePrediction;
}

async function getPrediction(id: string, apiToken: string): Promise<ReplicatePrediction> {
  const res = await fetch(`${REPLICATE_API}/predictions/${id}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Prediction fetch failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as ReplicatePrediction;
}

export async function generateFromScribble({ imageUri, prompt }: GenerateFromScribbleParams): Promise<string> {
  const apiToken = process.env.EXPO_PUBLIC_REPLICATE_TOKEN;
  // Pinned default: Replicate jagilley/controlnet-scribble version
  // https://replicate.com/jagilley/controlnet-scribble
  const DEFAULT_MODEL_VERSION = '435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117';
  const modelVersion = process.env.EXPO_PUBLIC_REPLICATE_MODEL_VERSION || DEFAULT_MODEL_VERSION;
  if (!apiToken) throw new Error('Missing EXPO_PUBLIC_REPLICATE_TOKEN');

  // 1) Upload user image to Replicate Files API
  const controlImageUrl = await uploadToReplicate(imageUri, apiToken);

  // 2) Create prediction. The exact input keys depend on chosen ControlNet model.
  // For jagilley/controlnet-scribble expected keys include: image, prompt, num_samples, image_resolution, ddim_steps, scale, seed, a_prompt, n_prompt
  const prediction = await createPrediction(
    modelVersion,
    {
      prompt,
      image: controlImageUrl,
      num_samples: '1',
      image_resolution: '768',
      ddim_steps: 28,
      scale: 8,
      seed: 42,
      a_prompt: 'best quality, highly detailed, watercolor children illustration, soft colors, gentle light',
      n_prompt: 'lowres, bad anatomy, extra fingers, cropped, worst quality, low quality, jpeg artifacts'
    },
    apiToken,
  );

  // 3) Poll until done
  let current = prediction;
  const started = Date.now();
  while (current.status === 'starting' || current.status === 'processing') {
    await new Promise((r) => setTimeout(r, 1800));
    current = await getPrediction(current.id, apiToken);
    if (Date.now() - started > 120000) {
      throw new Error('Prediction timeout');
    }
  }
  if (current.status !== 'succeeded') {
    throw new Error(current.error || 'Prediction failed');
  }

  const output = current.output;
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
    return output[0];
  }
  if (typeof output === 'string') return output;
  throw new Error('Unexpected output format');
}


