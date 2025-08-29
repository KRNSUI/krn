// FlexNetJSX JSX Runtime
// Virtual DOM and component system

import { curry } from '../../core/functions/index.js';

// ===== VIRTUAL DOM =====

// Create virtual DOM element
const createElement = (type, props, ...children) => {
  // Handle function components
  if (typeof type === 'function') {
    return type({ ...props, children: children.flat() });
  }
  
  // Handle string elements (HTML tags)
  return {
    type: 'element',
    tagName: type,
    props: props || {},
    children: children.flat().filter(child => child != null)
  };
};

// ===== RENDERING SYSTEM =====

// Render virtual DOM to real DOM
const render = (vnode, container) => {
  // Clear container
  container.innerHTML = '';
  
  // Render virtual node
  const element = renderNode(vnode);
  if (element) {
    container.appendChild(element);
  }
};

// Render individual node
const renderNode = (vnode) => {
  if (vnode == null || vnode === false) {
    return null;
  }
  
  // Handle text nodes
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(String(vnode));
  }
  
  // Handle virtual DOM elements
  if (vnode.type === 'element') {
    const element = document.createElement(vnode.tagName);
    
    // Set properties
    Object.entries(vnode.props || {}).forEach(([key, value]) => {
      if (key === 'children') return; // Skip children prop
      
      if (key.startsWith('on') && typeof value === 'function') {
        // Event handlers
        const eventName = key.toLowerCase().substring(2);
        element.addEventListener(eventName, value);
      } else if (key === 'className') {
        // Class attribute
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        // Style object
        Object.assign(element.style, value);
      } else {
        // Regular attributes
        element.setAttribute(key, value);
      }
    });
    
    // Render children
    vnode.children.forEach(child => {
      const childElement = renderNode(child);
      if (childElement) {
        element.appendChild(childElement);
      }
    });
    
    return element;
  }
  
  // Handle components (functions that return virtual DOM)
  if (typeof vnode === 'function') {
    return renderNode(vnode());
  }
  
  return null;
};

// ===== COMPONENT SYSTEM =====

// Create functional component
const createComponent = (renderFn) => {
  return (props) => {
    try {
      return renderFn(props);
    } catch (error) {
      console.error('Component error:', error);
      return createElement('div', { className: 'error' }, 'Component Error');
    }
  };
};

// ===== HOOKS SYSTEM =====

// State hook
const useState = (initialValue) => {
  let state = initialValue;
  let setState = (newValue) => {
    const newState = typeof newValue === 'function' ? newValue(state) : newValue;
    if (newState !== state) {
      state = newState;
      // Trigger re-render by dispatching a custom event
      window.dispatchEvent(new CustomEvent('stateChanged', { detail: { state } }));
    }
  };
  return [state, setState];
};

// Effect hook
const useEffect = (effect, dependencies = []) => {
  // In a full implementation, this would track dependencies and run effects
  // For now, just run the effect
  if (typeof effect === 'function') {
    effect();
  }
};

// ===== FRAGMENT SUPPORT =====

// Fragment component for grouping elements without wrapper
const Fragment = ({ children }) => children;

// ===== UTILITY COMPONENTS =====

// Error boundary component
const ErrorBoundary = ({ children, fallback }) => {
  try {
    return children;
  } catch (error) {
    console.error('Error boundary caught:', error);
    return fallback || createElement('div', { className: 'error' }, 'Something went wrong');
  }
};

// Conditional rendering component
const If = ({ condition, children, fallback = null }) => {
  return condition ? children : fallback;
};

// List rendering component
const For = ({ items, render }) => {
  return items.map(render);
};

// ===== DOM UTILITIES =====

// Find element by selector
const querySelector = curry((selector, element) => 
  element ? element.querySelector(selector) : null
);

// Find all elements by selector
const querySelectorAll = curry((selector, element) => 
  Array.from(element.querySelectorAll(selector))
);

// Add event listener
const addEventListener = curry((event, handler, element) => {
  element.addEventListener(event, handler);
  return element;
});

// Remove event listener
const removeEventListener = curry((event, handler, element) => {
  element.removeEventListener(event, handler);
  return element;
});

// ===== EXPORTS =====

export {
  createElement,
  render,
  renderNode,
  createComponent,
  useState,
  useEffect,
  Fragment,
  ErrorBoundary,
  If,
  For,
  querySelector,
  querySelectorAll,
  addEventListener,
  removeEventListener
};
