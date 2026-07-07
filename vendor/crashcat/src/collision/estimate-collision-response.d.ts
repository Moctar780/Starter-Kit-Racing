import { type Vec3 } from 'mathcat';
import type { RigidBody } from '../body/rigid-body';
import type { ContactManifold } from '../manifold/manifold';
/** impulse data for a single contact point in the collision estimation */
export type CollisionEstimationImpulse = {
    /** normal impulse (kg⋅m/s) */
    contactImpulse: number;
    /** friction impulse along tangent1 direction */
    frictionImpulse1: number;
    /** friction impulse along tangent2 direction */
    frictionImpulse2: number;
};
/** result of estimating collision response between two bodies, contains predicted post-collision velocities and per-contact-point impulses */
export type CollisionEstimationResult = {
    /** predicted post-collision linear velocity of body 1 */
    linearVelocity1: Vec3;
    /** predicted post-collision angular velocity of body 1 */
    angularVelocity1: Vec3;
    /** predicted post-collision linear velocity of body 2 */
    linearVelocity2: Vec3;
    /** predicted post-collision angular velocity of body 2 */
    angularVelocity2: Vec3;
    /** first friction tangent direction (perpendicular to normal) */
    tangent1: Vec3;
    /** second friction tangent direction (tangent1 × normal) */
    tangent2: Vec3;
    /** impulses for each contact point */
    impulses: CollisionEstimationImpulse[];
    /** number of active impulses (matches manifold.numContactPoints) */
    numImpulses: number;
};
/** create a new collision estimation result */
export declare function createCollisionEstimationResult(): CollisionEstimationResult;
/**
 * estimate collision response between two bodies
 *
 * predicts post-collision velocities and impulses by running a mini PGS solver
 * on a local copy of the velocities. designed to be called from onContactAdded
 * to estimate impact strength before the actual solver runs.
 *
 * @param result result object to write to
 * @param body1 first body
 * @param body2 second body
 * @param manifold contact manifold
 * @param combinedFriction combined friction coefficient
 * @param combinedRestitution combined restitution coefficient
 * @param minVelocityForRestitution minimum relative velocity to apply restitution (default 1.0 m/s)
 * @param numIterations number of PGS iterations (default 10)
 */
export declare function estimateCollisionResponse(result: CollisionEstimationResult, body1: RigidBody, body2: RigidBody, manifold: ContactManifold, combinedFriction: number, combinedRestitution: number, minVelocityForRestitution?: number, numIterations?: number): void;
