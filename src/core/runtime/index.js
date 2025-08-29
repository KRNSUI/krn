// FlexNetJSX Core Runtime
// Main entry point for FlexNetJSX framework

import { Maybe, Either, Result, Effect } from '../types/index.js';
import { createStore } from './store.js';

// ===== CORE RUNTIME EXPORTS =====

export {
  // Type system
  Maybe,
  Either,
  Result,
  Effect,
  
  // State management
  createStore
};

// Export all functions
export * from '../functions/index.js';

// ===== FRAMEWORK VERSION =====

export const VERSION = '1.0.0';
export const FRAMEWORK_NAME = 'FlexNetJSX';

// ===== FRAMEWORK INITIALIZATION =====

const FlexNetJSX = {
  version: VERSION,
  name: FRAMEWORK_NAME,
  
  // Core exports
  Maybe,
  Either,
  Result,
  Effect,
  
  // Store
  createStore,
  
  // Initialize framework
  init: () => {
    console.log(`🚀 ${FRAMEWORK_NAME} v${VERSION} initialized`);
    return FlexNetJSX;
  }
};

// Auto-initialize when imported
FlexNetJSX.init();

export default FlexNetJSX;
