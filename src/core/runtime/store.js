// FlexNetJSX Store
// Immutable state management for Karen on SUI application

import { identity } from '../functions/index.js';

// ===== STORE CREATION =====

// Create immutable state store
const createStore = (initialState) => {
  let state = initialState;
  let subscribers = [];
  
  return {
    getState: () => state,
    subscribe: (callback) => {
      subscribers.push(callback);
      return () => {
        subscribers = subscribers.filter(sub => sub !== callback);
      };
    },
    update: (updater) => {
      const newState = typeof updater === 'function' ? updater(state) : updater;
      if (newState !== state) {
        state = newState;
        subscribers.forEach(callback => callback(state));
      }
      return state;
    },
    reset: () => {
      state = initialState;
      subscribers.forEach(callback => callback(state));
      return state;
    }
  };
};

// ===== STORE UTILITIES =====

// Create a selector function
const createSelector = (selector) => selector;

// Create an action creator
const createAction = (type, payloadCreator = identity) => {
  return (...args) => ({
    type,
    payload: payloadCreator(...args)
  });
};

// ===== EXPORTS =====

export {
  createStore,
  createSelector,
  createAction
};
