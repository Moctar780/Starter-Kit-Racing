import type { World } from './world';
export declare enum BodyColorMode {
    MOTION_TYPE = 0,
    INSTANCE = 1,
    SLEEPING = 2,
    ISLAND = 3
}
export type DebugRenderResult = {
    /** Flat XYZ positions for line segments. Every 6 floats = one line (two verts). */
    vertices: Float32Array;
    /** Flat RGB colors, one per vertex — same length as vertices. */
    colors: Float32Array;
    /** Number of line segments. vertices.length === numLines * 6. */
    numLines: number;
};
export type BodiesOptions = {
    colorMode: BodyColorMode;
    showLinearVelocity: boolean;
    showAngularVelocity: boolean;
};
export type ContactsOptions = Record<string, never>;
export type ContactConstraintsOptions = Record<string, never>;
export type JointsOptions = {
    /** Axis arm length. Default 0.5. */
    size: number;
    /** Draw angular / translation limit indicators. Default true. */
    drawLimits: boolean;
};
export declare function createBodiesOptions(): BodiesOptions;
export declare function createContactsOptions(): ContactsOptions;
export declare function createContactConstraintsOptions(): ContactConstraintsOptions;
export declare function createJointsOptions(): JointsOptions;
/**
 * Render body wireframes.
 *
 * @example
 * const { vertices, colors } = debug.bodies(world);
 */
export declare function bodies(world: World, options?: Partial<BodiesOptions>): DebugRenderResult;
/**
 * Render contact points and normals.
 *
 * @example
 * const { vertices, colors } = debug.contacts(world);
 */
export declare function contacts(world: World, _options?: Partial<ContactsOptions>): DebugRenderResult;
/**
 * Render detailed contact constraint manifolds (points, edges, normal, tangents).
 *
 * @example
 * const { vertices, colors } = debug.contactConstraints(world);
 */
export declare function contactConstraints(world: World, _options?: Partial<ContactConstraintsOptions>): DebugRenderResult;
/**
 * Render joint/constraint axes and limits.
 *
 * @example
 * const { vertices, colors } = debug.joints(world);
 */
export declare function joints(world: World, options?: Partial<JointsOptions>): DebugRenderResult;
