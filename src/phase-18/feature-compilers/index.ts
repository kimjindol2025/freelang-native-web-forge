/**
 * Feature Compilers - Main Export
 *
 * Exports all 9 feature-focused compiler variants
 */

// Phase 1: Foundation
export { ExpressionCompiler } from './expression-compiler';
export { StatementCompiler } from './statement-compiler';

// Phase 2: Type System
export { TypeInferenceCompiler } from './type-inference-compiler';
export { GenericsCompiler } from './generics-compiler';

// Placeholder exports for future compilers
export { ExpressionCompiler as AsyncCompiler } from './expression-compiler';
export { StatementCompiler as PatternMatchCompiler } from './statement-compiler';
export { ExpressionCompiler as TraitCompiler } from './expression-compiler';
export { StatementCompiler as FFICompiler } from './statement-compiler';
export { ExpressionCompiler as OptimizationCompiler } from './expression-compiler';
