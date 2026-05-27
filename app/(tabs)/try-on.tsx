import { AR_FEATURES } from '../../src/config/arFeatures';
import { LiveTryOnExperience } from '../../src/components/ar/LiveTryOnExperience';
import TryOnLegacyScreen from './try-on.legacy';

/**
 * AR Try-On entry — toggle `liveTryOnV2` in src/config/arFeatures.ts to revert.
 */
export default function TryOnScreen() {
  if (AR_FEATURES.liveTryOnV2) {
    return <LiveTryOnExperience />;
  }
  return <TryOnLegacyScreen />;
}
