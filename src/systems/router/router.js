// FlexNetJSX Router System
// Functional routing with guards for Karen on SUI application

import { Maybe, Either, Result, Effect } from '../../core/types/index.js';
import { getState, selectIsConnected, selectUserPermissions } from '../state/index.js';
import { createElement, useEffect } from '../render/jsx.js';

// ===== ROUTE DEFINITIONS =====

const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  MANAGER: '/manager',
  ENTITLEMENTS: '/entitlements',
  VOTE: '/vote',
  FEED: '/feed',
  POST: '/post',
  BOT: '/bot',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  TERMS: '/terms'
};

// ===== ROUTE GUARDS =====

// Guard that requires wallet connection
const requireWallet = (route) => ({
  ...route,
  guard: (state) => {
    try {
      const isConnected = selectIsConnected(state);
      console.log('Wallet guard check:', { isConnected, state: !!state });
      // Always allow access to the route, but mark it as requiring wallet
      return Either.Right({
        ...route,
        requiresWallet: !isConnected
      });
    } catch (error) {
      console.error('Wallet guard error:', error);
      return Either.Right({
        ...route,
        requiresWallet: true
      });
    }
  }
});

// Guard that requires specific permissions
const requirePermission = (permission) => (route) => ({
  ...route,
  guard: (state) => {
    const permissions = selectUserPermissions(state);
    return permissions[permission]
      ? Either.Right(route)
      : Either.Left({ 
          redirect: ROUTES.HOME, 
          message: `You need ${permission} permission to access this page` 
        });
  }
});

// Guard that requires KRN balance
const requireKRNBalance = (minBalance = 1) => (route) => ({
  ...route,
  guard: (state) => {
    const balance = state.user.balance.KRN;
    return balance >= minBalance
      ? Either.Right(route)
      : Either.Left({ 
          redirect: ROUTES.HOME, 
          message: `You need at least ${minBalance} KRN to access this page` 
        });
  }
});

// ===== ROUTE CONFIGURATION =====

const routeConfig = {
  [ROUTES.HOME]: {
    path: '/',
    component: 'HomePage',
    title: 'Karen on SUI - Home',
    public: true
  },
  
  [ROUTES.ABOUT]: {
    path: '/about',
    component: 'AboutPage',
    title: 'Karen on SUI - About',
    public: true
  },
  
  [ROUTES.MANAGER]: {
    path: '/manager',
    component: 'ManagerPage',
    title: 'Karen on SUI - Speak to the Manager',
    public: true
  },
  
  [ROUTES.ENTITLEMENTS]: {
    path: '/entitlements',
    component: 'EntitlementsPage',
    title: 'Karen on SUI - File a Complaint',
    public: true
  },
  
  [ROUTES.VOTE]: requireWallet({
    path: '/vote',
    component: 'VotePage',
    title: 'Karen on SUI - Vote on Content',
    public: false
  }),
  
  [ROUTES.FEED]: requireWallet({
    path: '/feed',
    component: 'FeedPage',
    title: 'Karen on SUI - Feed',
    public: false
  }),
  
  [ROUTES.POST]: requirePermission('canPost')({
    path: '/post',
    component: 'PostPage',
    title: 'Karen on SUI - Create Post',
    public: false
  }),
  
  [ROUTES.BOT]: requireKRNBalance(1)({
    path: '/bot',
    component: 'BotPage',
    title: 'Karen on SUI - AI Chat',
    public: false
  }),
  
  [ROUTES.PROFILE]: requireWallet({
    path: '/profile',
    component: 'ProfilePage',
    title: 'Karen on SUI - Profile',
    public: false
  }),
  
  [ROUTES.SETTINGS]: requireWallet({
    path: '/settings',
    component: 'SettingsPage',
    title: 'Karen on SUI - Settings',
    public: false
  }),
  
  [ROUTES.TERMS]: {
    path: '/terms',
    component: 'TermsPage',
    title: 'Karen on SUI - Terms of Service',
    public: true
  }
};

// ===== ROUTER CORE =====

const Router = {
  currentRoute: null,
  history: [],
  listeners: [],
  
  // Initialize router
  init: () => {
    console.log('Router init - current pathname:', window.location.pathname);
    
    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
      console.log('Popstate event:', event.state?.path);
      Router.navigate(event.state?.path || '/', false);
    });
    
    // Handle initial route
    const initialPath = window.location.pathname;
    console.log('Router init - navigating to initial path:', initialPath);
    Router.navigate(initialPath, false);
  },
  
  // Navigate to route
  navigate: (path, updateHistory = true) => {
    try {
      const route = Router.matchRoute(path);
      
      if (route.isLeft()) {
        const error = route.value;
        console.warn('Navigation error:', error?.message || 'Unknown navigation error');
        
        // Redirect to fallback route
        if (error?.redirect && error.redirect !== path) {
          Router.navigate(error.redirect, updateHistory);
          return;
        }
      }
    
          const validRoute = route.fold(
        () => routeConfig[ROUTES.HOME],
        (r) => r
      );
      
      // Update browser history
      if (updateHistory) {
        window.history.pushState({ path }, validRoute.title, path);
      }
      
      // Update current route
      Router.currentRoute = validRoute;
      
      // Update page title
      document.title = validRoute.title;
      
      // Notify listeners
      Router.notifyListeners(validRoute);
      
      // Add to history
      Router.history.push({
        path,
        timestamp: Date.now(),
        route: validRoute
      });
    } catch (error) {
      console.error('Router navigation error:', error);
      // Fallback to home page
      Router.navigate(ROUTES.HOME, updateHistory);
    }
  },
  
  // Match route with guards
  matchRoute: (path) => {
    try {
      console.log('🔍 Matching route for path:', path);
      const route = Object.values(routeConfig).find(r => r.path === path);
      
      if (!route) {
        console.warn('Route not found:', path);
        return Either.Left({ 
          redirect: ROUTES.HOME, 
          message: 'Route not found' 
        });
      }
      
      console.log('Found route:', route);
      
      // Check guards if they exist
      if (route.guard) {
        console.log('Route has guard, checking...');
        const state = getState();
        console.log('Route guard check:', { path, hasState: !!state, hasGuard: !!route.guard });
        const guardResult = route.guard(state);
        console.log('Guard result:', guardResult);
        return guardResult;
      }
      
      console.log('Route has no guard, returning directly');
      return Either.Right(route);
    } catch (error) {
      console.error('Route matching error:', error);
      return Either.Left({ 
        redirect: ROUTES.HOME, 
        message: 'Error matching route' 
      });
    }
  },
  
  // Get current route
  getCurrentRoute: () => Router.currentRoute,
  
  // Get route history
  getHistory: () => [...Router.history],
  
  // Subscribe to route changes
  subscribe: (listener) => {
    console.log('Router subscribe - adding listener, current count:', Router.listeners.length);
    Router.listeners.push(listener);
    console.log('Router subscribe - listener added, new count:', Router.listeners.length);
    
    // Return unsubscribe function
    return () => {
      console.log('Router unsubscribe - removing listener');
      Router.listeners = Router.listeners.filter(l => l !== listener);
      console.log('Router unsubscribe - listener removed, new count:', Router.listeners.length);
    };
  },
  
  // Notify listeners
  notifyListeners: (route) => {
    console.log('Router notifyListeners:', { route, listenerCount: Router.listeners.length });
    Router.listeners.forEach((listener, index) => {
      try {
        console.log(`Calling listener ${index}:`, route);
        listener(route);
      } catch (error) {
        console.error(`Router listener ${index} error:`, error);
      }
    });
  },
  
  // Go back
  back: () => {
    if (Router.history.length > 1) {
      Router.history.pop(); // Remove current
      const previous = Router.history[Router.history.length - 1];
      Router.navigate(previous.path, false);
    }
  },
  
  // Go forward (if available)
  forward: () => {
    // This would require maintaining a forward stack
    // For simplicity, we'll just navigate to home
    Router.navigate(ROUTES.HOME);
  }
};

// ===== ROUTE UTILITIES =====

// Create route link
const createLink = (path, text, className = '') => {
  const link = document.createElement('a');
  link.href = path;
  link.textContent = text;
  link.className = className;
  
  link.addEventListener('click', (event) => {
    event.preventDefault();
    Router.navigate(path);
  });
  
  return link;
};

// Create route button
const createRouteButton = (path, text, className = '') => {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = className;
  
  button.addEventListener('click', () => {
    Router.navigate(path);
  });
  
  return button;
};

// Check if route is active
const isActiveRoute = (path) => {
  return Router.currentRoute?.path === path;
};

// Get route parameters from URL
const getRouteParams = (path) => {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);
  
  urlParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

// Build URL with parameters
const buildUrl = (path, params = {}) => {
  const url = new URL(path, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.pathname + url.search;
};

// ===== ROUTE COMPONENTS =====

// Route component wrapper
const Route = ({ path, component, children }) => {
  const isActive = isActiveRoute(path);
  return isActive ? children : null;
};

// Link component
const Link = ({ to, children, className = '', ...props }) => {
  const handleClick = (event) => {
    event.preventDefault();
    Router.navigate(to);
  };
  
  return createElement('a', {
    href: to,
    onClick: handleClick,
    className,
    ...props
  }, children);
};

// Navigate component (programmatic navigation)
const Navigate = ({ to, replace = false }) => {
  useEffect(() => {
    Router.navigate(to, !replace);
  }, [to, replace]);
  
  return null;
};

// ===== EXPORTS =====

export {
  ROUTES,
  routeConfig,
  Router,
  requireWallet,
  requirePermission,
  requireKRNBalance,
  createLink,
  createRouteButton,
  isActiveRoute,
  getRouteParams,
  buildUrl,
  Route,
  Link,
  Navigate
};
