import type { TransformFunction } from './types';
import { videoOptimizationConfig } from '../media-optimization-config';

/**
 * Apply quality settings to a video using CRF (Constant Rate Factor)
 * CRF range: 0 (lossless) to 51 (lowest quality)
 * 
 * Quality mapping:
 * - quality 100 → CRF 18 (very high quality)
 * - quality 50 → CRF 28 (medium quality)
 * - quality 10 → CRF 45 (low quality)
 */
export const applyQuality: TransformFunction = (
  command,
  context
) => {
  // Skip quality settings for thumbnail extraction
  if (context.isThumbnail) {
    return command;
  }

  const { quality } = context.params;

  // Default quality is configurable so production deployments can trade speed
  // for smaller outputs without forcing q_ on every request.
  const defaultQuality = videoOptimizationConfig.defaultQuality;
  const qualityValue = quality !== undefined
    ? (typeof quality === 'string' ? parseInt(quality, 10) : quality)
    : defaultQuality;

  // Validate quality range (0-100)
  if (isNaN(qualityValue) || qualityValue < 0 || qualityValue > 100) {
    // Use default if invalid
    const crf = Math.round(51 - (defaultQuality / 100) * 33);
    let configuredCommand = command
      .videoCodec('libx264')
      .addOption('-preset', videoOptimizationConfig.encodingPreset)
      .addOption('-crf', crf.toString());

    if (videoOptimizationConfig.encodingTune) {
      configuredCommand = configuredCommand.addOption('-tune', videoOptimizationConfig.encodingTune);
    }

    if (videoOptimizationConfig.h264Profile) {
      configuredCommand = configuredCommand.addOption('-profile:v', videoOptimizationConfig.h264Profile);
    }

    if (videoOptimizationConfig.h264Level) {
      configuredCommand = configuredCommand.addOption('-level', videoOptimizationConfig.h264Level);
    }

    configuredCommand = configuredCommand.audioCodec(videoOptimizationConfig.audioCodec);
    if (videoOptimizationConfig.audioCodec !== 'copy' && videoOptimizationConfig.audioBitrate) {
      configuredCommand = configuredCommand.audioBitrate(videoOptimizationConfig.audioBitrate);
    }

    return configuredCommand;
  }

  // Convert quality (0-100) to CRF (51-0)
  // Higher quality = lower CRF
  const crf = Math.round(51 - (qualityValue / 100) * 33);

  let configuredCommand = command
    .videoCodec('libx264')
    .addOption('-preset', videoOptimizationConfig.encodingPreset)
    .addOption('-crf', crf.toString());

  if (videoOptimizationConfig.encodingTune) {
    configuredCommand = configuredCommand.addOption('-tune', videoOptimizationConfig.encodingTune);
  }

  if (videoOptimizationConfig.h264Profile) {
    configuredCommand = configuredCommand.addOption('-profile:v', videoOptimizationConfig.h264Profile);
  }

  if (videoOptimizationConfig.h264Level) {
    configuredCommand = configuredCommand.addOption('-level', videoOptimizationConfig.h264Level);
  }

  configuredCommand = configuredCommand.audioCodec(videoOptimizationConfig.audioCodec);
  if (videoOptimizationConfig.audioCodec !== 'copy' && videoOptimizationConfig.audioBitrate) {
    configuredCommand = configuredCommand.audioBitrate(videoOptimizationConfig.audioBitrate);
  }

  return configuredCommand;
};
