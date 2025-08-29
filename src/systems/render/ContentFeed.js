// FlexNetJSX Content Feed Component
// Displays posts with censored/uncensored content and KRN-powered actions

import { createElement, useState, useEffect } from './jsx.js';
import { subscribe, selectPosts, selectFavorites, selectFlags, selectContentFilter, selectContentLoading, selectIsConnected, selectKRNBalance } from '../state/index.js';
import { dispatch, contentActions } from '../state/index.js';
import { KRNTokenManager } from '../wallet/sui.js';

// ===== CONTENT FEED COMPONENT =====

const ContentFeed = ({ filter = 'all' }) => {
  const [state, setState] = useState({
    posts: [],
    favorites: new Set(),
    flags: new Set(),
    filter: 'all',
    loading: false,
    isConnected: false,
    krnBalance: 0
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribe((appState) => {
      setState({
        posts: selectPosts(appState),
        favorites: selectFavorites(appState),
        flags: selectFlags(appState),
        filter: selectContentFilter(appState),
        loading: selectContentLoading(appState),
        isConnected: selectIsConnected(appState),
        krnBalance: selectKRNBalance(appState)
      });
    });

    return unsubscribe;
  }, []);

  // Handle favorite action
  const handleFavorite = async (postId) => {
    if (!state.isConnected) {
      alert('Please connect your wallet to favorite posts');
      return;
    }

    const isFavorited = state.favorites.has(postId);
    const action = isFavorited ? 1 : 0; // 0=favorite, 1=unfavorite

    try {
      const result = await KRNTokenManager.executeKRTransaction(action, postId, 1);
      
      if (result.isSuccess()) {
        dispatch(contentActions.toggleFavorite(postId));
      } else {
        alert(`Failed to ${isFavorited ? 'unfavorite' : 'favorite'} post: ${result.value}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Handle flag action
  const handleFlag = async (postId) => {
    if (!state.isConnected) {
      alert('Please connect your wallet to flag posts');
      return;
    }

    const isFlagged = state.flags.has(postId);
    const action = 2; // 2=flag

    try {
      const result = await KRNTokenManager.executeKRTransaction(action, postId, 1);
      
      if (result.isSuccess()) {
        dispatch(contentActions.toggleFlag(postId));
      } else {
        alert(`Failed to flag post: ${result.value}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Filter posts based on current filter
  const getFilteredPosts = () => {
    switch (state.filter) {
      case 'censored':
        return state.posts.filter(post => post.isCensored);
      case 'uncensored':
        return state.posts.filter(post => !post.isCensored);
      default:
        return state.posts;
    }
  };

  // Render post item
  const renderPost = (post) => {
    const isFavorited = state.favorites.has(post.id);
    const isFlagged = state.flags.has(post.id);

    return createElement('div', { 
      key: post.id,
      className: `post-item ${post.isCensored ? 'censored' : 'uncensored'}`
    },
      createElement('div', { className: 'post-header' },
        createElement('span', { className: 'post-id' }, `#${post.id}`),
        createElement('span', { className: 'post-timestamp' }, new Date(post.timestamp).toLocaleString()),
        createElement('span', { className: `post-status ${post.isCensored ? 'censored' : 'uncensored'}` }, 
          post.isCensored ? 'Censored' : 'Uncensored'
        )
      ),
      
      createElement('div', { className: 'post-content' },
        post.isCensored 
          ? createElement('div', { className: 'censored-content' },
              createElement('p', null, 'This content has been censored.'),
              createElement('button', {
                className: 'btn btn-secondary btn-sm',
                onClick: () => handleUncensor(post.id)
              }, 'View Content (1 KRN)')
            )
          : createElement('p', { className: 'post-text' }, post.content)
      ),
      
      createElement('div', { className: 'post-actions' },
        createElement('button', {
          className: `btn btn-sm ${isFavorited ? 'btn-favorited' : 'btn-favorite'}`,
          onClick: () => handleFavorite(post.id),
          disabled: !state.isConnected
        }, 
          isFavorited ? '★ Unfavorite (1 KRN)' : '☆ Favorite (1 KRN)'
        ),
        
        createElement('button', {
          className: `btn btn-sm ${isFlagged ? 'btn-flagged' : 'btn-flag'}`,
          onClick: () => handleFlag(post.id),
          disabled: !state.isConnected
        }, 
          isFlagged ? '🚩 Unflag (1 KRN)' : '🚩 Flag (1 KRN)'
        ),
        
        createElement('span', { className: 'post-stats' },
          createElement('span', { className: 'favorites-count' }, `${post.favorites || 0} favorites`),
          createElement('span', { className: 'flags-count' }, `${post.flags || 0} flags`)
        )
      )
    );
  };

  // Render filter controls
  const renderFilterControls = () => {
    return createElement('div', { className: 'filter-controls' },
      createElement('button', {
        className: `btn btn-sm ${state.filter === 'all' ? 'btn-active' : ''}`,
        onClick: () => dispatch(contentActions.setFilter('all'))
      }, 'All'),
      
      createElement('button', {
        className: `btn btn-sm ${state.filter === 'censored' ? 'btn-active' : ''}`,
        onClick: () => dispatch(contentActions.setFilter('censored'))
      }, 'Censored'),
      
      createElement('button', {
        className: `btn btn-sm ${state.filter === 'uncensored' ? 'btn-active' : ''}`,
        onClick: () => dispatch(contentActions.setFilter('uncensored'))
      }, 'Uncensored')
    );
  };

  // Render loading state
  const renderLoading = () => {
    return createElement('div', { className: 'loading' },
      createElement('p', null, 'Loading posts...')
    );
  };

  // Render empty state
  const renderEmpty = () => {
    return createElement('div', { className: 'empty-state' },
      createElement('p', null, 'No posts found.'),
      !state.isConnected && createElement('p', { className: 'muted' }, 
        'Connect your wallet to see posts.'
      )
    );
  };

  // Main render
  return createElement('div', { className: 'content-feed' },
    renderFilterControls(),
    
    state.loading 
      ? renderLoading()
      : getFilteredPosts().length > 0
        ? createElement('div', { className: 'posts-list' },
            getFilteredPosts().map(renderPost)
          )
        : renderEmpty()
  );
};

// ===== POST COMPONENT =====

const Post = ({ post, onFavorite, onFlag, isFavorited, isFlagged, isConnected }) => {
  return createElement('div', { className: `post ${post.isCensored ? 'censored' : 'uncensored'}` },
    createElement('div', { className: 'post-header' },
      createElement('span', { className: 'post-id' }, `#${post.id}`),
      createElement('span', { className: 'post-timestamp' }, 
        new Date(post.timestamp).toLocaleString()
      )
    ),
    
    createElement('div', { className: 'post-content' },
      post.isCensored 
        ? createElement('div', { className: 'censored-content' },
            createElement('p', null, 'This content has been censored.')
          )
        : createElement('p', { className: 'post-text' }, post.content)
    ),
    
    createElement('div', { className: 'post-actions' },
      createElement('button', {
        className: `btn btn-sm ${isFavorited ? 'btn-favorited' : 'btn-favorite'}`,
        onClick: () => onFavorite(post.id),
        disabled: !isConnected
      }, isFavorited ? '★' : '☆'),
      
      createElement('button', {
        className: `btn btn-sm ${isFlagged ? 'btn-flagged' : 'btn-flag'}`,
        onClick: () => onFlag(post.id),
        disabled: !isConnected
      }, '🚩')
    )
  );
};

// ===== CENSORED CONTENT COMPONENT =====

const CensoredContent = ({ postId, onUncensor, krnBalance }) => {
  const [isUncensoring, setIsUncensoring] = useState(false);

  const handleUncensor = async () => {
    if (krnBalance < 1) {
      alert('You need at least 1 KRN to view censored content');
      return;
    }

    setIsUncensoring(true);
    
    try {
      await onUncensor(postId);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsUncensoring(false);
    }
  };

  return createElement('div', { className: 'censored-content' },
    createElement('p', null, 'This content has been censored.'),
    createElement('button', {
      className: 'btn btn-secondary btn-sm',
      onClick: handleUncensor,
      disabled: isUncensoring || krnBalance < 1
    }, isUncensoring ? 'Uncensoring...' : 'View Content (1 KRN)')
  );
};

// ===== POST ACTIONS COMPONENT =====

const PostActions = ({ postId, isFavorited, isFlagged, onFavorite, onFlag, isConnected, krnBalance }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action) => {
    if (!isConnected) {
      alert('Please connect your wallet to perform actions');
      return;
    }

    if (krnBalance < 1) {
      alert('You need at least 1 KRN to perform this action');
      return;
    }

    setIsProcessing(true);
    
    try {
      if (action === 'favorite') {
        await onFavorite(postId);
      } else if (action === 'flag') {
        await onFlag(postId);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return createElement('div', { className: 'post-actions' },
    createElement('button', {
      className: `btn btn-sm ${isFavorited ? 'btn-favorited' : 'btn-favorite'}`,
      onClick: () => handleAction('favorite'),
      disabled: !isConnected || isProcessing
    }, isFavorited ? '★ Unfavorite' : '☆ Favorite'),
    
    createElement('button', {
      className: `btn btn-sm ${isFlagged ? 'btn-flagged' : 'btn-flag'}`,
      onClick: () => handleAction('flag'),
      disabled: !isConnected || isProcessing
    }, isFlagged ? '🚩 Unflag' : '🚩 Flag'),
    
    createElement('span', { className: 'krn-cost' }, '(1 KRN each)')
  );
};

// ===== EXPORTS =====

export {
  ContentFeed,
  Post,
  CensoredContent,
  PostActions
};
