// FlexNetJSX State Management System
// Immutable state management for Karen on SUI application

import { createStore, createSelector, createAction } from '../../core/runtime/store.js';
import { Maybe, Either, Result } from '../../core/types/index.js';
import { compose, pipe, curry, assoc, dissoc } from '../../core/functions/index.js';

// ===== STATE TYPES =====

// User state
const createUserState = () => ({
  isConnected: false,
  address: null,
  balance: {
    KRN: 0,
    SUI: 0
  },
  permissions: {
    canRead: false,
    canPost: false,
    canFavorite: false,
    canFlag: false
  }
});

// Wallet state
const createWalletState = () => ({
  isConnecting: false,
  provider: null,
  network: null,
  error: null
});

// Content state
const createContentState = () => ({
  posts: [],
  favorites: new Set(),
  flags: new Set(),
  filter: 'all', // 'all', 'censored', 'uncensored'
  loading: false,
  error: null
});

// App state
const createAppState = () => ({
  user: createUserState(),
  wallet: createWalletState(),
  content: createContentState(),
  ui: {
    theme: 'light',
    sidebarOpen: false,
    modal: null
  }
});

// ===== STATE STORE =====

// Create main application store
const appStore = createStore(createAppState());

// ===== STATE SELECTORS =====

// User selectors
const selectUser = (state) => state.user;
const selectIsConnected = (state) => state.user.isConnected;
const selectUserAddress = (state) => state.user.address;
const selectKRNBalance = (state) => state.user.balance.KRN;
const selectSUIBalance = (state) => state.user.balance.SUI;
const selectUserPermissions = (state) => state.user.permissions;

// Wallet selectors
const selectWallet = (state) => state.wallet;
const selectIsConnecting = (state) => state.wallet.isConnecting;
const selectWalletProvider = (state) => state.wallet.provider;
const selectWalletError = (state) => state.wallet.error;

// Content selectors
const selectContent = (state) => state.content;
const selectPosts = (state) => state.content.posts;
const selectFavorites = (state) => state.content.favorites;
const selectFlags = (state) => state.content.flags;
const selectContentFilter = (state) => state.content.filter;
const selectContentLoading = (state) => state.content.loading;

// UI selectors
const selectUI = (state) => state.ui;
const selectTheme = (state) => state.ui.theme;
const selectSidebarOpen = (state) => state.ui.sidebarOpen;
const selectModal = (state) => state.ui.modal;

// ===== STATE ACTIONS =====

// User actions
const userActions = {
  // Connect wallet
  connectWallet: (address) => (state) => ({
    ...state,
    user: {
      ...state.user,
      isConnected: true,
      address,
      permissions: {
        canRead: true,
        canPost: true,
        canFavorite: true,
        canFlag: true
      }
    },
    wallet: {
      ...state.wallet,
      isConnecting: false,
      error: null
    }
  }),

  // Disconnect wallet
  disconnectWallet: () => (state) => ({
    ...state,
    user: createUserState(),
    wallet: {
      ...state.wallet,
      isConnecting: false,
      provider: null,
      error: null
    }
  }),

  // Update balance
  updateBalance: (balance) => (state) => ({
    ...state,
    user: {
      ...state.user,
      balance: { ...state.user.balance, ...balance }
    }
  }),

  // Update permissions
  updatePermissions: (permissions) => (state) => ({
    ...state,
    user: {
      ...state.user,
      permissions: { ...state.user.permissions, ...permissions }
    }
  })
};

// Wallet actions
const walletActions = {
  // Start connecting
  startConnecting: () => (state) => ({
    ...state,
    wallet: {
      ...state.wallet,
      isConnecting: true,
      error: null
    }
  }),

  // Set provider
  setProvider: (provider) => (state) => ({
    ...state,
    wallet: {
      ...state.wallet,
      provider
    }
  }),

  // Set network
  setNetwork: (network) => (state) => ({
    ...state,
    wallet: {
      ...state.wallet,
      network
    }
  }),

  // Set error
  setWalletError: (error) => (state) => ({
    ...state,
    wallet: {
      ...state.wallet,
      error,
      isConnecting: false
    }
  })
};

// Content actions
const contentActions = {
  // Set posts
  setPosts: (posts) => (state) => ({
    ...state,
    content: {
      ...state.content,
      posts,
      loading: false
    }
  }),

  // Add post
  addPost: (post) => (state) => ({
    ...state,
    content: {
      ...state.content,
      posts: [post, ...state.content.posts]
    }
  }),

  // Update post
  updatePost: (postId, updates) => (state) => ({
    ...state,
    content: {
      ...state.content,
      posts: state.content.posts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    }
  }),

  // Remove post
  removePost: (postId) => (state) => ({
    ...state,
    content: {
      ...state.content,
      posts: state.content.posts.filter(post => post.id !== postId)
    }
  }),

  // Toggle favorite
  toggleFavorite: (postId) => (state) => {
    const favorites = new Set(state.content.favorites);
    if (favorites.has(postId)) {
      favorites.delete(postId);
    } else {
      favorites.add(postId);
    }
    return {
      ...state,
      content: {
        ...state.content,
        favorites
      }
    };
  },

  // Toggle flag
  toggleFlag: (postId) => (state) => {
    const flags = new Set(state.content.flags);
    if (flags.has(postId)) {
      flags.delete(postId);
    } else {
      flags.add(postId);
    }
    return {
      ...state,
      content: {
        ...state.content,
        flags
      }
    };
  },

  // Set filter
  setFilter: (filter) => (state) => ({
    ...state,
    content: {
      ...state.content,
      filter
    }
  }),

  // Set loading
  setLoading: (loading) => (state) => ({
    ...state,
    content: {
      ...state.content,
      loading
    }
  }),

  // Set error
  setContentError: (error) => (state) => ({
    ...state,
    content: {
      ...state.content,
      error,
      loading: false
    }
  })
};

// UI actions
const uiActions = {
  // Toggle theme
  toggleTheme: () => (state) => ({
    ...state,
    ui: {
      ...state.ui,
      theme: state.ui.theme === 'light' ? 'dark' : 'light'
    }
  }),

  // Toggle sidebar
  toggleSidebar: () => (state) => ({
    ...state,
    ui: {
      ...state.ui,
      sidebarOpen: !state.ui.sidebarOpen
    }
  }),

  // Set modal
  setModal: (modal) => (state) => ({
    ...state,
    ui: {
      ...state.ui,
      modal
    }
  }),

  // Close modal
  closeModal: () => (state) => ({
    ...state,
    ui: {
      ...state.ui,
      modal: null
    }
  })
};

// ===== STORE METHODS =====

// Dispatch action
const dispatch = (action) => {
  const currentState = appStore.getState();
  const newState = typeof action === 'function' ? action(currentState) : action;
  appStore.update(newState);
};

// Subscribe to state changes
const subscribe = (callback) => appStore.subscribe(callback);

// Get current state
const getState = () => appStore.getState();

// Reset state
const resetState = () => appStore.reset();

// ===== EXPORTS =====

export {
  // State creators
  createUserState,
  createWalletState,
  createContentState,
  createAppState,
  
  // Selectors
  selectUser,
  selectIsConnected,
  selectUserAddress,
  selectKRNBalance,
  selectSUIBalance,
  selectUserPermissions,
  selectWallet,
  selectIsConnecting,
  selectWalletProvider,
  selectWalletError,
  selectContent,
  selectPosts,
  selectFavorites,
  selectFlags,
  selectContentFilter,
  selectContentLoading,
  selectUI,
  selectTheme,
  selectSidebarOpen,
  selectModal,
  
  // Actions
  userActions,
  walletActions,
  contentActions,
  uiActions,
  
  // Store methods
  dispatch,
  subscribe,
  getState,
  resetState
};
