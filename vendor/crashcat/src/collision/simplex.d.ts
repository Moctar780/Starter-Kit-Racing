import type { Vec3 } from 'mathcat';
/** point in a simplex */
export type SimplexPoint = {
    /** minkowski difference (P - Q) */
    y: Vec3;
    /** support point on shape A */
    p: Vec3;
    /** support point on shape B */
    q: Vec3;
};
/** simplex used in GJK/EPA algorithms */
export type Simplex = {
    /** points in the simplex */
    points: [SimplexPoint, SimplexPoint, SimplexPoint, SimplexPoint];
    /** current number of points in the simplex */
    size: number;
};
/** creates a new simplex */
export declare const createSimplex: () => Simplex;
/** copies a simplex */
export declare const copySimplex: (out: Simplex, input: Simplex) => Simplex;
