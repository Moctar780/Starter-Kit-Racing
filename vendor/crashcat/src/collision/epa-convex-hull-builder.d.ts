import { type Vec3 } from 'mathcat';
export type Edge = {
    neighbourTriangle: Triangle | null;
    neighbourEdge: number;
    startIndex: number;
};
export declare function createEdge(): Edge;
export declare function copyEdge(dest: Edge, src: Edge): void;
export type Triangle = {
    edge: [Edge, Edge, Edge];
    normal: Vec3;
    centroid: Vec3;
    closestLengthSq: number;
    lambda: [number, number];
    lambdaRelativeTo0: boolean;
    closestPointInterior: boolean;
    removed: boolean;
    inQueue: boolean;
    iteration: number;
    index: number;
};
export declare function allocateTriangle(): Triangle;
export declare function triangleIsFacing(triangle: Triangle, position: Vec3): boolean;
export type Points = {
    values: Vec3[];
    size: number;
};
export declare function createPoints(capacity: number): Points;
export type Edges = {
    values: Edge[];
    size: number;
};
export declare function createEdges(capacity: number): Edges;
type StackEntry = {
    triangle: Triangle | null;
    edge: number;
    iter: number;
};
export type NewTriangles = Triangle[];
export type EpaConvexHullBuilderState = {
    triangles: Triangle[];
    freeTriangles: number[];
    queue: Triangle[];
    positions: Vec3[];
    stack: StackEntry[];
    edges: Edges;
};
export declare function init(): EpaConvexHullBuilderState;
export declare function linkTriangle(t1: Triangle, edge1: number, t2: Triangle, edge2: number): void;
export declare function createTriangle(state: EpaConvexHullBuilderState, idx1: number, idx2: number, idx3: number): Triangle | null;
export declare function initialize(state: EpaConvexHullBuilderState, idx1: number, idx2: number, idx3: number): void;
export declare function hasNextTriangle(state: EpaConvexHullBuilderState): boolean;
export declare function peekClosestTriangleInQueue(state: EpaConvexHullBuilderState): Triangle | null;
export declare function popClosestTriangleFromQueue(state: EpaConvexHullBuilderState): Triangle | null;
export declare function findFacingTriangle(state: EpaConvexHullBuilderState, position: Vec3, outBestDistSq: {
    value: number;
}): Triangle | null;
export declare function freeTriangle(state: EpaConvexHullBuilderState, triangle: Triangle): void;
export declare function unlinkTriangle(state: EpaConvexHullBuilderState, triangle: Triangle): void;
export declare function findEdge(state: EpaConvexHullBuilderState, facingTriangle: Triangle, vertex: Vec3, outEdges: Edges): boolean;
export declare function addPoint(state: EpaConvexHullBuilderState, facingTriangle: Triangle, idx: number, closestDistSq: number, outTriangles: NewTriangles): boolean;
export {};
