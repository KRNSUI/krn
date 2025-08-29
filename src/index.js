// FlexNetJSX Karen on SUI Application Entry Point
// Main application initialization and rendering

import { render, createElement } from './systems/render/jsx.js';
import { App } from './systems/render/App.js';
import FlexNetJSX from './core/runtime/index.js';

// ===== APPLICATION INITIALIZATION =====

// Global variables for re-rendering
let rootElement = null;
let currentAppElement = null;

// Initialize the application when DOM is ready
const initializeApp = () => {
  console.log('🚀 Initializing Karen on SUI Application with FlexNetJSX');
  console.log(`Framework: ${FlexNetJSX.name} v${FlexNetJSX.version}`);
  
  // Find the root element
  rootElement = document.getElementById('root');
  console.log('🔍 Root element found:', rootElement);
  
  if (!rootElement) {
    console.error('Root element not found. Make sure you have <div id="root"></div> in your HTML.');
    return;
  }
  
  try {
    console.log('🎯 About to render App component...');
    console.log('🎭 App component:', App);
    console.log('🎨 Render function:', render);
    console.log('🔧 CreateElement function:', createElement);
    
    // Create and render the main App component
    currentAppElement = createElement(App);
    console.log('🎪 Created app element:', currentAppElement);
    
    render(currentAppElement, rootElement);
    
    console.log('✅ Karen on SUI Application initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    
    // Render error fallback
    render(
      createElement('div', { className: 'error-fallback' },
        createElement('h1', null, 'Application Error'),
        createElement('p', null, 'Failed to load the Karen on SUI application.'),
        createElement('p', null, 'Please refresh the page or check the console for details.'),
        createElement('button', {
          onClick: () => window.location.reload()
        }, 'Reload Page')
      ),
      rootElement
    );
  }
};

// Re-render function for state changes
const reRenderApp = () => {
  if (rootElement) {
    console.log('🔄 Re-rendering application due to state change...');
    try {
      // Re-create the app element to get fresh virtual DOM
      const freshAppElement = createElement(App);
      render(freshAppElement, rootElement);
      console.log('✅ Re-render completed successfully');
    } catch (error) {
      console.error('❌ Re-render failed:', error);
    }
  }
};

// ===== DOM READY HANDLER =====

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// ===== STATE CHANGE HANDLER =====

// Listen for state changes to trigger re-renders
window.addEventListener('stateChanged', (event) => {
  console.log('📡 State change detected:', event.detail);
  reRenderApp();
});

// ===== GLOBAL ERROR HANDLING =====

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Handle global errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// ===== DEVELOPMENT HELPERS =====

// Expose app for development/debugging
if (process.env.NODE_ENV === 'development') {
  window.KRNApp = {
    render,
    App,
    FlexNetJSX,
    // Add other exports for debugging
  };
  
  console.log('🔧 Development mode enabled. App available at window.KRNApp');
}

// ===== SERVICE WORKER REGISTRATION =====

// Register service worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// ===== EXPORTS =====

export { initializeApp };
