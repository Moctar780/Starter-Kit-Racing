import * as coneConstraint from './constraints/cone-constraint';
import * as distanceConstraint from './constraints/distance-constraint';
import * as fixedConstraint from './constraints/fixed-constraint';
import * as hingeConstraint from './constraints/hinge-constraint';
import * as sixDOFConstraint from './constraints/six-dof-constraint';
import * as sliderConstraint from './constraints/slider-constraint';
import * as swingTwistConstraint from './constraints/swing-twist-constraint';
import * as box from './shapes/box';
import * as capsule from './shapes/capsule';
import * as compound from './shapes/compound';
import * as convexHull from './shapes/convex-hull';
import * as cylinder from './shapes/cylinder';
import * as emptyShape from './shapes/empty-shape';
import * as offsetCenterOfMass from './shapes/offset-center-of-mass';
import * as plane from './shapes/plane';
import * as scaled from './shapes/scaled';
import * as sphere from './shapes/sphere';
import * as staticCompound from './shapes/static-compound';
import * as transformed from './shapes/transformed';
import * as triangleMesh from './shapes/triangle-mesh';
export declare const ALL_SHAPE_DEFS: (import(".").ShapeDef<box.BoxShape> | import(".").ShapeDef<capsule.CapsuleShape> | import(".").ShapeDef<compound.CompoundShape> | import(".").ShapeDef<convexHull.ConvexHullShape> | import(".").ShapeDef<cylinder.CylinderShape> | import(".").ShapeDef<emptyShape.EmptyShape> | import(".").ShapeDef<offsetCenterOfMass.OffsetCenterOfMassShape> | import(".").ShapeDef<plane.PlaneShape> | import(".").ShapeDef<scaled.ScaledShape> | import(".").ShapeDef<sphere.SphereShape> | import(".").ShapeDef<staticCompound.StaticCompoundShape> | import(".").ShapeDef<transformed.TransformedShape> | import(".").ShapeDef<triangleMesh.TriangleMeshShape>)[];
export declare const ALL_CONSTRAINT_DEFS: (import("./constraints/constraints").ConstraintDef<coneConstraint.ConeConstraint> | import("./constraints/constraints").ConstraintDef<distanceConstraint.DistanceConstraint> | import("./constraints/constraints").ConstraintDef<fixedConstraint.FixedConstraint> | import("./constraints/constraints").ConstraintDef<hingeConstraint.HingeConstraint> | import("./constraints/constraints").ConstraintDef<sixDOFConstraint.SixDOFConstraint> | import("./constraints/constraints").ConstraintDef<sliderConstraint.SliderConstraint> | import("./constraints/constraints").ConstraintDef<swingTwistConstraint.SwingTwistConstraint>)[];
/** register all built-in shapes */
export declare function registerAllShapes(): void;
/** register all built-in constraints */
export declare function registerAllConstraints(): void;
/** register all built-in shapes and constraints */
export declare function registerAll(): void;
