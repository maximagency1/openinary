type OptimizationMode = "balanced" | "max";

function parseOptimizationMode(value: string | undefined): OptimizationMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "max" || normalized === "maximum" || normalized === "aggressive") {
    return "max";
  }
  return "balanced";
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(value)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(value)) {
    return false;
  }

  return fallback;
}

function parseIntegerEnv(
  name: string,
  fallback: number,
  options?: { min?: number; max?: number },
): number {
  const raw = process.env[name]?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  let value = parsed;
  if (options?.min !== undefined) {
    value = Math.max(options.min, value);
  }
  if (options?.max !== undefined) {
    value = Math.min(options.max, value);
  }

  return value;
}

function parseStringEnv(name: string, fallback?: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

function parseOptionalStringEnv(name: string, fallback?: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) {
    return fallback;
  }

  if (value.toLowerCase() === "none") {
    return undefined;
  }

  return value;
}

const imageMode = parseOptimizationMode(process.env.IMAGE_OPTIMIZATION_MODE);
const videoMode = parseOptimizationMode(process.env.VIDEO_OPTIMIZATION_MODE);

export const imageOptimizationConfig = {
  mode: imageMode,
  avifEffort: parseIntegerEnv("IMAGE_AVIF_EFFORT", imageMode === "max" ? 9 : 1, {
    min: 0,
    max: 9,
  }),
  webpEffort: parseIntegerEnv("IMAGE_WEBP_EFFORT", imageMode === "max" ? 6 : 1, {
    min: 0,
    max: 6,
  }),
  jpegProgressive: parseBooleanEnv("IMAGE_JPEG_PROGRESSIVE", imageMode === "max"),
  jpegMozjpeg: parseBooleanEnv("IMAGE_JPEG_MOZJPEG", imageMode === "max"),
  pngCompressionLevel: parseIntegerEnv(
    "IMAGE_PNG_COMPRESSION_LEVEL",
    imageMode === "max" ? 9 : 3,
    { min: 0, max: 9 },
  ),
  pngAdaptiveFiltering: parseBooleanEnv(
    "IMAGE_PNG_ADAPTIVE_FILTERING",
    imageMode === "max",
  ),
  preserveMetadata: parseBooleanEnv(
    "IMAGE_PRESERVE_METADATA",
    imageMode !== "max",
  ),
};

export const videoOptimizationConfig = {
  mode: videoMode,
  defaultQuality: parseIntegerEnv(
    "VIDEO_DEFAULT_QUALITY",
    videoMode === "max" ? 55 : 60,
    { min: 1, max: 100 },
  ),
  encodingPreset: parseStringEnv(
    "VIDEO_ENCODING_PRESET",
    videoMode === "max" ? "veryslow" : "ultrafast",
  )!,
  encodingTune: parseOptionalStringEnv(
    "VIDEO_ENCODING_TUNE",
    videoMode === "max" ? undefined : "fastdecode",
  ),
  h264Profile: parseOptionalStringEnv(
    "VIDEO_H264_PROFILE",
    videoMode === "max" ? "high" : "baseline",
  ),
  h264Level: parseOptionalStringEnv(
    "VIDEO_H264_LEVEL",
    videoMode === "max" ? undefined : "3.0",
  ),
  audioCodec: parseStringEnv(
    "VIDEO_AUDIO_CODEC",
    videoMode === "max" ? "aac" : "copy",
  )!,
  audioBitrate: parseOptionalStringEnv(
    "VIDEO_AUDIO_BITRATE",
    videoMode === "max" ? "128k" : undefined,
  ),
  processingTimeoutMs: parseIntegerEnv(
    "VIDEO_PROCESS_TIMEOUT_MS",
    videoMode === "max" ? 1800000 : 300000,
    { min: 60000 },
  ),
};

export function getMaxVideoSourceSizeBytes(): number {
  const fallbackMb = 200;
  const sizeMb = parseIntegerEnv("MAX_VIDEO_SOURCE_SIZE_MB", fallbackMb, { min: 1 });
  return sizeMb * 1024 * 1024;
}

