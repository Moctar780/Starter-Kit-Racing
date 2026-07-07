import type { Box3 } from 'mathcat';
export declare const INITIAL_EARLY_OUT_FRACTION: number;
export declare const SHOULD_EARLY_OUT_FRACTION = 0;
/**
 * Compute distance fraction along ray to box entry point.
 * Returns Infinity if ray doesn't intersect box or if box is behind ray origin.
 *
 * @param originX Ray origin X coordinate
 * @param originY Ray origin Y coordinate
 * @param originZ Ray origin Z coordinate
 * @param directionX Ray direction X component
 * @param directionY Ray direction Y component
 * @param directionZ Ray direction Z component
 * @param length Ray length
 * @param box The bounding box to test against
 * @returns Normalized distance (0-1) to box entry point, or Infinity if no hit
 */
export declare function rayDistanceToBox3(originX: number, originY: number, originZ: number, directionX: number, directionY: number, directionZ: number, length: number, box: Box3): number;
