import { type Mat4, type Vec3 } from 'mathcat';
import type { Bodies } from '../body/bodies';
import * as body from '../body/rigid-body';
import * as contacts from '../contacts';
import type { Listener } from '../listener';
import type { ContactManifold } from '../manifold/manifold';
import type { WorldSettings } from '../world-settings';
import * as axisConstraintPart from './constraint-part/axis-constraint-part';
/** state for contact constraint solving, holds all active constraints and manages constraint lifecycle */
export type ContactConstraints = {
    /** pool of contact constraints (grows as needed, never shrinks) */
    pool: ContactConstraint[];
    /** number of active constraints (first count entries in pool array are valid) */
    count: number;
};
/**
 * Contact constraint for a body pair.
 * Contains all contact points and shared constraint data.
 *
 * One ContactConstraint per active collision pair per frame.
 * Can have 1-4 contact points.
 * All contact points share the same normal/tangent directions and material properties.
 */
export type ContactConstraint = {
    /** index of first body in the contact constraint */
    bodyIndexA: number;
    /** index of second body in the contact constraint */
    bodyIndexB: number;
    /** sub-shape ID of shape A */
    subShapeIdA: number;
    /** sub-shape ID of shape B */
    subShapeIdB: number;
    /** normalized contact normal (points from A toward B), same for all 4 contact points in this manifold */
    normal: Vec3;
    /** first tangent vector (perpendicular to normal), computed as: normalize(cross(normal, arbitrary_vector)) */
    tangent1: Vec3;
    /** second tangent vector (perpendicular to normal and tangent1), computed as: cross(normal, tangent1) */
    tangent2: Vec3;
    /** combined friction coefficient, computed from both bodies' friction values. typical range: 0.0 (frictionless) to 1.0+ (high friction) */
    friction: number;
    /** combined restitution coefficient, controls bounce behavior. typical range: 0.0 (no bounce) to 1.0+ (perfect bounce) */
    restitution: number;
    /** number of active contact points (0-4), used to track how many of the pre-allocated contactPoints are valid */
    numContactPoints: number;
    /** pool of 4 contact points, only the first numContactPoints entries are valid */
    contactPoints: [WorldContactPoint, WorldContactPoint, WorldContactPoint, WorldContactPoint];
    /** inverse mass of body A (1/massA), 0 if body is static. cached from body at constraint setup time */
    invMassA: number;
    /** inverse mass of body B (1/massB), 0 if body is static. cached from body at constraint setup time */
    invMassB: number;
    /** inverse inertia matrix of body A, used to compute angular impulse response. cached from body at constraint setup time */
    invInertiaA: Mat4;
    /** inverse mass matrix of body B, used to compute angular impulse response. cached from body at constraint setup time */
    invInertiaB: Mat4;
    /** inverse inertia scale for body A, applied during position constraint solving to override inertia */
    invInertiaScaleA: number;
    /** inverse inertia scale for body B, applied during position constraint solving to override inertia */
    invInertiaScaleB: number;
    /** index of the contact in the global contact array, used to look up contact for writing back solved impulses */
    contactIndex: number;
    /** sort key for deterministic ordering */
    sortKey: number;
};
/**
 * A single contact point with full constraint data.
 * Links world-space geometry to constraint solving.
 *
 * Each contact point has 3 constraint axes:
 * - Normal: prevents penetration (1 DOF)
 * - Tangent1: friction in first direction (1 DOF)
 * - Tangent2: friction in second direction (1 DOF)
 * Total: 3 DOF per contact point (max 4 points = 12 DOF per manifold)
 */
export type WorldContactPoint = {
    /**
     * Contact point position on body A (world space).
     * Recomputed each solving iteration from local position + body transform.
     */
    positionA: Vec3;
    /**
     * Contact point position on body B (world space).
     * Recomputed each solving iteration from local position + body transform.
     */
    positionB: Vec3;
    /**
     * Contact point position in body A's local/relative space (center of mass space).
     * Constant - used to recompute world position when body moves.
     */
    localPositionA: Vec3;
    /**
     * Contact point position in body B's local/relative space (center of mass space).
     * Constant - used to recompute world position when body moves.
     */
    localPositionB: Vec3;
    /**
     * Normal constraint: prevents interpenetration.
     * Direction: contact normal (perpendicular to contact surface).
     * Lambda clamping: normalLambda >= 0 (push only, no pull).
     */
    normalConstraint: axisConstraintPart.AxisConstraintPart;
    /**
     * Friction constraint 1: resists motion in first tangent direction.
     * Direction: first tangent (perpendicular to normal).
     * Lambda clamping: |tangentLambda1| <= friction * normalLambda.
     */
    tangentConstraint1: axisConstraintPart.AxisConstraintPart;
    /**
     * Friction constraint 2: resists motion in second tangent direction.
     * Direction: second tangent (perpendicular to normal and tangent1).
     * Lambda clamping: |tangentLambda2| <= friction * normalLambda.
     */
    tangentConstraint2: axisConstraintPart.AxisConstraintPart;
};
/**
 * Settings for a contact constraint, passed to contact listener callbacks.
 * A @see Listener can modify these settings to customize the contact behavior.
 */
export type ContactSettings = {
    /** combined friction coefficient for the contact */
    combinedFriction: number;
    /** combined restitution (bounciness) for the contact */
    combinedRestitution: number;
    /** if true, contact is treated as a sensor (no physical response) */
    isSensor: boolean;
    /** scale factor for body 1's inverse mass (default 1.0) */
    invMassScale1: number;
    /** scale factor for body 2's inverse mass (default 1.0) */
    invMassScale2: number;
    /** scale factor for body 1's inverse inertia (default 1.0) */
    invInertiaScale1: number;
    /** scale factor for body 2's inverse inertia (default 1.0) */
    invInertiaScale2: number;
    /** relative linear surface velocity (body 2 relative to body 1) */
    relativeLinearSurfaceVelocity: Vec3;
    /** relative angular surface velocity (body 2 relative to body 1) */
    relativeAngularSurfaceVelocity: Vec3;
};
/** creates emopty contact constraints state */
export declare function init(): ContactConstraints;
/** create a contact settings object */
export declare function createContactSettings(): ContactSettings;
/** copy contact settings properties from a source object */
export declare function copyContactSettings(out: ContactSettings, source: ContactSettings): ContactSettings;
/** add a contact constraint from a new manifold */
export declare function addContactConstraint(contactConstraints: ContactConstraints, contactsState: contacts.Contacts, bodyA: body.RigidBody, bodyB: body.RigidBody, contactManifold: ContactManifold, settings: WorldSettings, contactListener: Listener | undefined, deltaTime: number): boolean;
/**
 * Apply warm start impulses from previous frame to give solver a good initial guess.
 * This significantly improves convergence speed (~3x faster).
 * @param contactConstraints contact constraint state
 * @param warmStartRatio scale factor for warm start impulses (usually 1.0)
 */
export declare function warmStartVelocityConstraints(contactConstraints: ContactConstraints, bodies: Bodies, warmStartRatio: number): void;
/**
 * Solve velocity constraints for a specific island. Only processes constraints at the given indices.
 * @param contactConstraints contact constraint state
 * @param bodies body array
 * @param constraintIndices indices of constraints to solve (from island)
 * @returns true if any impulse was applied (not yet converged)
 */
export declare function solveVelocityConstraintsForIsland(contactConstraints: ContactConstraints, bodies: Bodies, constraintIndices: number[]): boolean;
/**
 * Store solved impulses back to Contact array for warm starting next frame.
 * Must be called after solveVelocityConstraints to persist the solved lambda values.
 * @param contactConstraints contact constraint state
 * @param contactsState contacts state
 */
export declare function storeAppliedImpulses(contactConstraints: ContactConstraints, contactsState: contacts.Contacts): void;
/**
 * Solve position constraints for a specific island. Only processes constraints at the given indices.
 *
 * @param contactConstraints contact constraint state
 * @param bodies body array
 * @param constraintIndices indices of constraints to solve (from island)
 * @param penetrationSlop allowed penetration before correction
 * @param baumgarteFactor position correction factor 0-1
 * @param maxPenetrationDistance maximum distance to correct in a single iteration
 * @returns true if any impulses were applied
 */
export declare function solvePositionConstraintsForIsland(contactConstraints: ContactConstraints, bodies: Bodies, constraintIndices: number[], penetrationSlop: number, baumgarteFactor: number, maxPenetrationDistance: number): boolean;
/**
 * Sort contact constraint indices for deterministic solving.
 * Sorts by:
 * 1. Sort key (hash of body pair + sub-shapes)
 * 2. Body A ID
 * 3. Body B ID
 */
export declare function sortContactIndices(contactConstraints: ContactConstraints, bodies: Bodies, contactIndices: number[]): void;
