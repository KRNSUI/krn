// FlexNetJSX Main App Component
// Orchestrates the entire Karen on SUI application

import { createElement, useState, useEffect } from './jsx.js';
import { subscribe, selectIsConnected, selectUserAddress, selectKRNBalance, selectUI } from '../state/index.js';
import { Router, ROUTES } from '../router/router.js';
import { WalletConnect, WalletStatus, KRNBalance } from './WalletConnect.js';
import { ContentFeed } from './ContentFeed.js';

// ===== MAIN APP COMPONENT =====

const App = () => {
  console.log('🎭 App component rendering...');
  
  const [state, setState] = useState({
    isConnected: false,
    address: null,
    krnBalance: 0,
    currentRoute: null,
    theme: 'dark',
    sidebarOpen: false
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribe((appState) => {
      setState(prev => ({
        ...prev,
        isConnected: selectIsConnected(appState),
        address: selectUserAddress(appState),
        krnBalance: selectKRNBalance(appState),
        theme: selectUI(appState).theme,
        sidebarOpen: selectUI(appState).sidebarOpen
      }));
    });

    return unsubscribe;
  }, []);

  // Subscribe to route changes
  useEffect(() => {
    const unsubscribe = Router.subscribe((route) => {
      setState(prev => ({
        ...prev,
        currentRoute: route
      }));
    });

    return unsubscribe;
  }, []);

  // Initialize router
  useEffect(() => {
    Router.init();
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.className = `theme-${state.theme}`;
  }, [state.theme]);

  // Render header
  const renderHeader = () => {
    return createElement('header', { className: 'app-header' },
      createElement('div', { className: 'header-content' },
        createElement('div', { className: 'header-left' },
          createElement('h1', { className: 'app-title' }, 'Karen on SUI'),
          createElement('p', { className: 'app-subtitle' }, 'Anonymous Complaints Platform')
        ),
        
        createElement('div', { className: 'header-right' },
          createElement(WalletStatus),
          createElement(KRNBalance),
          createElement(WalletConnect, {
            onConnect: (address) => {
              console.log('Wallet connected:', address);
            },
            onDisconnect: () => {
              console.log('Wallet disconnected');
            }
          })
        )
      )
    );
  };

  // Render navigation
  const renderNavigation = () => {
    return createElement('nav', { className: 'app-navigation' },
      createElement('div', { className: 'nav-content' },
        createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.HOME ? 'active' : ''}`,
          href: ROUTES.HOME,
          onClick: (e) => {
            e.preventDefault();
            Router.navigate(ROUTES.HOME);
          }
        }, 'Home'),
        
        createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.ABOUT ? 'active' : ''}`,
          href: ROUTES.ABOUT,
          onClick: (e) => {
            e.preventDefault();
            Router.navigate(ROUTES.ABOUT);
          }
        }, 'About'),
        
        createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.MANAGER ? 'active' : ''}`,
          href: ROUTES.MANAGER,
          onClick: (e) => {
            e.preventDefault();
            Router.navigate(ROUTES.MANAGER);
          }
        }, 'Speak to the Manager'),
        
        createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.ENTITLEMENTS ? 'active' : ''}`,
          href: ROUTES.ENTITLEMENTS,
          onClick: (e) => {
            e.preventDefault();
            Router.navigate(ROUTES.ENTITLEMENTS);
          }
        }, 'File a Complaint'),
        
        state.isConnected && createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.VOTE ? 'active' : ''}`,
          href: ROUTES.VOTE,
          onClick: (e) => {
            e.preventDefault();
            Router.navigate(ROUTES.VOTE);
          }
        }, 'Vote'),
        
        state.isConnected && createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.FEED ? 'active' : ''}`,
          href: ROUTES.FEED,
          onClick: (e) => {
            e.preventDefault();
            Router.navigate(ROUTES.FEED);
          }
        }, 'Feed'),
        
        state.isConnected && createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.POST ? 'active' : ''}`,
          href: ROUTES.POST,
          onClick: (e) => {
            e.preventDefault();
            Router.navigate(ROUTES.POST);
          }
        }, 'Post'),
        
        state.isConnected && createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.BOT ? 'active' : ''}`,
          href: ROUTES.BOT,
          onClick: (e) => {
            e.preventDefault();
            Router.navigate(ROUTES.BOT);
          }
        }, 'AI Chat'),
        
        createElement('a', {
          className: 'nav-link external',
          href: 'https://blast.fun/token/0x76ff24af704e0b6d6a121ab23e5ea9e8343c29a0c50f664ab0f01b2f2858c758?ref=Aemon',
          target: '_blank',
          rel: 'noopener'
        }, 'Buy KRN')
      )
    );
  };

  // Render home page
  const renderHomePage = () => {
    return createElement('div', { className: 'page home-page' },
      createElement('div', { className: 'hero-section' },
        createElement('h2', null, 'Welcome to Karen on SUI'),
        createElement('p', { className: 'app-subtitle' }, 'Anonymous Complaints Platform'),
        createElement('p', null, 
          'A platform for anonymous complaints on the SUI blockchain. ' +
          'Connect your wallet to start posting, favoriting, and flagging content with KRN tokens.'
        ),
        
        !state.isConnected && createElement('div', { className: 'cta-section' },
          createElement('p', { className: 'cta-text' }, 'Connect your wallet to get started'),
          createElement(WalletConnect, {
            onConnect: (address) => {
              console.log('Wallet connected from home:', address);
            }
          })
        )
      ),
      

      
      // Three Container Items
      createElement('div', { className: 'info-containers' },
        createElement('div', { className: 'info-card' },
          createElement('h3', null, '🏛️ DAO Governance'),
          createElement('p', null, 
            'Community-driven moderation through KRN token voting. ' +
            'Every action contributes to the decentralized governance system.'
          ),
          createElement('ul', null,
            createElement('li', null, 'Vote on content moderation'),
            createElement('li', null, 'Propose platform changes'),
            createElement('li', null, 'Earn rewards for participation')
          )
        ),
        
        createElement('div', { className: 'info-card' },
          createElement('h3', null, '⚡ SUI Blockchain'),
          createElement('p', null, 
            'Built on the high-performance SUI blockchain for instant transactions ' +
            'and transparent, immutable complaint records.'
          ),
          createElement('ul', null,
            createElement('li', null, 'Instant KRN transactions'),
            createElement('li', null, 'Immutable complaint history'),
            createElement('li', null, 'Transparent moderation actions')
          )
        ),
        
        createElement('div', { className: 'info-card' },
          createElement('h3', null, '🤖 AI Manager'),
          createElement('p', null, 
            'Connect with our AI manager for help, questions, or to learn more ' +
            'about the Karen on SUI ecosystem and KRN token usage.'
          ),
          createElement('ul', null,
            createElement('li', null, 'Platform navigation help'),
            createElement('li', null, 'KRN token guidance'),
            createElement('li', null, 'Community support')
          )
        )
      )
    );
  };

  // Render about page
  const renderAboutPage = () => {
    return createElement('div', { className: 'page about-page' },
      createElement('div', { className: 'hero-section' },
        createElement('h2', null, 'About Karen on SUI'),
        createElement('p', null, 
          'Karen on SUI is a revolutionary platform that combines blockchain technology with community-driven content moderation.'
        )
      ),
      
      // Karen Lore Section
      createElement('div', { className: 'lore-section' },
        createElement('div', { className: 'lore-content' },
          createElement('h3', null, 'The Ascended Karen'),
          createElement('p', null, 
            'In the chaos of Web3\'s endless lines and broken promises; there rose a figure, not a woman but an archetype; ' +
            'the eternal complainer, the seeker of managers, the voice that would not be silenced. From that voice $KRN was born; ' +
            'a token forged in the fires of grievance, sharpened by entitlement, and wrapped in the divine right to "speak to the blockchain\'s manager."'
          ),
          createElement('p', null, 
            'Yet within the satire lies power; for $KRN gathers every complaint, every demand, every eye roll, ' +
            'and alchemizes them into a living record of accountability. What began as a meme of impatience now stands as myth; ' +
            'the Karen ascended, her spirit immortalized in orange flame, forever calling out the broken and bending reality to her will.'
          ),
          createElement('p', { className: 'lore-signature' }, 
            '– KRN 🔶'
          )
        )
      ),
      
      // KRN Token Chart Section
      createElement('div', { className: 'krn-chart-section' },
        createElement('h3', null, 'KRN Token Statistics'),
        createElement('div', { className: 'chart-container' },
          createElement('div', { className: 'chart-wrap' },
            createElement('canvas', { id: 'priceChart', width: '800', height: '400' })
          )
        ),
        createElement('div', { className: 'token-info' },
          createElement('div', { className: 'token-details' },
            createElement('h4', null, 'Token Details'),
            createElement('p', null, createElement('strong', null, 'Name: '), createElement('span', { id: 'coinName' }, 'KRN')),
            createElement('p', null, createElement('strong', null, 'Symbol: '), createElement('span', { id: 'coinSymbol' }, 'KRN')),
            createElement('p', null, createElement('strong', null, 'Total Supply: '), createElement('span', { id: 'coinSupply' }, '—'))
          ),
          createElement('div', { className: 'top-holders' },
            createElement('h4', null, 'Top Holders'),
            createElement('ul', { id: 'holdersList', className: 'holders' })
          )
        )
      ),
      
      createElement('div', { className: 'about-content' },
        createElement('div', { className: 'about-section' },
          createElement('h3', null, 'Our Mission'),
          createElement('p', null, 
            'We believe in the power of anonymous expression while maintaining community standards through token-backed actions. ' +
            'Every KRN token spent on moderation actions helps fund the platform and rewards content creators.'
          )
        ),
        
        createElement('div', { className: 'about-section' },
          createElement('h3', null, 'How It Works'),
          createElement('ul', null,
            createElement('li', null, 'Connect your SUI wallet to access the platform'),
            createElement('li', null, 'Post anonymous complaints and content'),
            createElement('li', null, 'Use KRN tokens to favorite, unfavorite, or flag content'),
            createElement('li', null, 'Community-driven moderation through token-backed actions'),
            createElement('li', null, 'Earn rewards by creating quality content')
          )
        ),
        
        createElement('div', { className: 'about-section' },
          createElement('h3', null, 'Technology'),
          createElement('p', null, 
            'Built on the SUI blockchain using FlexNetJSX framework, Karen on SUI provides a secure, ' +
            'scalable, and user-friendly experience for anonymous content creation and community moderation.'
          )
        )
      )
    );
  };

  // Render manager page (krnbot)
  const renderManagerPage = () => {
    return createElement('div', { className: 'page manager-page' },
      createElement('div', { className: 'hero-section' },
        createElement('h2', null, 'Speak to the Manager'),
        createElement('p', null, 
          'Complain to the Chain. For those that want to speak with the Manager.'
        )
      ),
      
      createElement('div', { className: 'manager-content' },
        createElement('div', { className: 'manager-info' },
          createElement('h3', null, 'AI Manager'),
          createElement('p', null, 
            'You are "KRN", the Ascended Karen—fiery, entitled, theatrically aggrieved. ' +
            'Tone: sharp, witty, eye-rolling, with sizzling orange-glow confidence.'
          ),
          createElement('p', null, 
            'The manager can help with:'
          ),
          createElement('ul', null,
            createElement('li', null, 'Platform navigation and features'),
            createElement('li', null, 'KRN token usage and transactions'),
            createElement('li', null, 'Content posting guidelines'),
            createElement('li', null, 'Wallet connection issues'),
            createElement('li', null, 'General questions about Karen on SUI')
          )
        ),
        
        createElement('div', { className: 'chat-interface' },
          createElement('h3', null, 'Chat with Manager'),
          createElement('p', null, 'Connect with our AI manager for help and guidance.'),
          createElement('div', { className: 'chat-container' },
            createElement('iframe', {
              src: '/krnbot/',
              title: 'KRN Bot Chat',
              className: 'chat-frame',
              frameBorder: '0'
            })
          )
        )
      )
    );
  };

  // Render entitlements page (original form and feed)
  const renderEntitlementsPage = () => {
    return createElement('div', { className: 'page entitlements-page' },
      createElement('div', { className: 'hero-section' },
        createElement('h2', null, 'File a Complaint'),
        createElement('p', null, 
          'Complain to the Chain. For those that want to speak with the Manager.'
        )
      ),
      
      // Original Form and Feed Layout
      createElement('div', { className: 'krn-layout' },
        // Form column
        createElement('div', { className: 'form-col' },
          createElement('div', { className: 'card' },
            createElement('h3', null, 'Submit Your Complaint'),
            createElement('p', { className: 'muted' }, 
              'Share your anonymous complaint with the community. ' +
              'Be useful; be witty; be lawful. No PII; no harassment; the chain remembers.'
            ),
            createElement(ComplaintForm)
          )
        ),
        
        // Feed column
        createElement('div', { className: 'feed-col' },
          createElement('div', { className: 'feed' },
            createElement('div', { id: 'feed' }, 'Loading complaints...')
          )
        )
      ),
      
      // Feed navigation
      createElement('div', { id: 'feed-nav', className: 'feed-nav' })
    );
  };

  // Render vote page (moderation)
  const renderVotePage = () => {
    const [activeTab, setActiveTab] = useState('favorited');
    
    return createElement('div', { className: 'page vote-page' },
      createElement('div', { className: 'hero-section' },
        createElement('h2', null, 'Vote on Content'),
        createElement('p', null, 
          'Community moderation through KRN token voting. Vote on top favorited, disliked, or flagged items.'
        )
      ),
      
      createElement('div', { className: 'vote-content' },
        createElement('div', { className: 'vote-tabs' },
          createElement('button', { 
            className: `tab-btn ${activeTab === 'favorited' ? 'active' : ''}`,
            onClick: () => setActiveTab('favorited')
          }, 'Most Favorited'),
          createElement('button', { 
            className: `tab-btn ${activeTab === 'disliked' ? 'active' : ''}`,
            onClick: () => setActiveTab('disliked')
          }, 'Most Disliked'),
          createElement('button', { 
            className: `tab-btn ${activeTab === 'flagged' ? 'active' : ''}`,
            onClick: () => setActiveTab('flagged')
          }, 'Most Flagged')
        ),
        
        createElement('div', { className: 'vote-items' },
          createElement('div', { className: 'vote-section' },
            createElement('h3', null, 'Content Requiring Moderation'),
            createElement('p', { className: 'muted' }, 
              'Review and vote on content that has received significant community feedback. ' +
              'Your KRN tokens give you voting power in community governance.'
            ),
            createElement('div', { id: 'vote-feed' }, 'Loading moderation items...')
          )
        ),
        
        createElement('div', { className: 'vote-actions' },
          createElement('h3', null, 'Moderation Actions'),
          createElement('p', { className: 'muted' }, 
            'Use your KRN tokens to vote on content moderation decisions.'
          ),
          createElement('div', { className: 'action-buttons' },
            createElement('button', { className: 'btn btn-danger' }, 'Remove Content'),
            createElement('button', { className: 'btn btn-warning' }, 'Ban Wallet Address'),
            createElement('button', { className: 'btn btn-success' }, 'Approve Content')
          )
        )
      )
    );
  };

  // Render feed page
  const renderFeedPage = () => {
    if (!state.isConnected) {
      return createElement('div', { className: 'page feed-page' },
        createElement('div', { className: 'connect-prompt' },
          createElement('h2', null, 'Connect Your Wallet'),
          createElement('p', null, 'You need to connect your wallet to view the feed'),
          createElement(WalletConnect)
        )
      );
    }

    return createElement('div', { className: 'page feed-page' },
      createElement('h2', null, 'Content Feed'),
      createElement(ContentFeed)
    );
  };

  // Render post page
  const renderPostPage = () => {
    if (!state.isConnected) {
      return createElement('div', { className: 'page post-page' },
        createElement('div', { className: 'connect-prompt' },
          createElement('h2', null, 'Connect Your Wallet'),
          createElement('p', null, 'You need to connect your wallet to create posts'),
          createElement(WalletConnect)
        )
      );
    }

    return createElement('div', { className: 'page post-page' },
      createElement('h2', null, 'Create Post'),
      createElement(PostForm)
    );
  };

  // Render bot page
  const renderBotPage = () => {
    if (!state.isConnected) {
      return createElement('div', { className: 'page bot-page' },
        createElement('div', { className: 'connect-prompt' },
          createElement('h2', null, 'Connect Your Wallet'),
          createElement('p', null, 'You need to connect your wallet to access AI chat'),
          createElement(WalletConnect)
        )
      );
    }

    if (state.krnBalance < 1) {
      return createElement('div', { className: 'page bot-page' },
        createElement('div', { className: 'krn-prompt' },
          createElement('h2', null, 'Insufficient KRN'),
          createElement('p', null, 'You need at least 1 KRN to access AI chat'),
          createElement('a', {
            className: 'btn btn-primary',
            href: 'https://blast.fun/token/0x76ff24af704e0b6d6a121ab23e5ea9e8343c29a0c50f664ab0f01b2f2858c758?ref=Aemon',
            target: '_blank',
            rel: 'noopener'
          }, 'Buy KRN')
        )
      );
    }

    return createElement('div', { className: 'page bot-page' },
      createElement('h2', null, 'AI Chat'),
      createElement('p', null, 'AI chat feature coming soon...')
    );
  };

  // Render main content based on current route
  const renderMainContent = () => {
    const route = state.currentRoute?.path;
    
    switch (route) {
      case ROUTES.HOME:
        return renderHomePage();
      case ROUTES.ABOUT:
        return renderAboutPage();
      case ROUTES.MANAGER:
        return renderManagerPage();
      case ROUTES.ENTITLEMENTS:
        return renderEntitlementsPage();
      case ROUTES.VOTE:
        return renderVotePage();
      case ROUTES.FEED:
        return renderFeedPage();
      case ROUTES.POST:
        return renderPostPage();
      case ROUTES.BOT:
        return renderBotPage();
      default:
        return renderHomePage();
    }
  };

  // Render footer
  const renderFooter = () => {
    return createElement('footer', { className: 'app-footer' },
      createElement('div', { className: 'footer-content' },
        createElement('div', { className: 'footer-links' },
          createElement('a', {
            href: 'https://github.com/KRNSUI',
            target: '_blank',
            rel: 'noopener'
          }, 'GitHub'),
          createElement('a', {
            href: 'https://x.com/KRNonsui',
            target: '_blank',
            rel: 'noopener'
          }, 'X (Twitter)'),
          createElement('a', {
            href: 'https://t.me/+_o-Osjl6_-g1ZTEx',
            target: '_blank',
            rel: 'noopener'
          }, 'Telegram')
        ),
        createElement('p', { className: 'footer-text' }, 
          'Karen on SUI - Anonymous Complaints Platform'
        )
      )
    );
  };

  // Main render
  return createElement('div', { className: 'app' },
    renderHeader(),
    renderNavigation(),
    createElement('main', { className: 'app-main' },
      renderMainContent()
    ),
    renderFooter()
  );
};



// ===== COMPLAINT FORM COMPONENT =====

const ComplaintForm = () => {
  const [formData, setFormData] = useState({
    message: '',
    isSubmitting: false
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.message.trim()) {
      alert('Please enter your complaint');
      return;
    }

    setFormData(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const formDataObj = new FormData();
      formDataObj.append('message', formData.message);
      
      const response = await fetch('/submit', {
        method: 'POST',
        body: formDataObj
      });
      
      if (response.ok) {
        // Reset form
        setFormData({ message: '', isSubmitting: false });
        alert('Complaint submitted successfully!');
        // Refresh the feed
        if (window.loadFeed) {
          window.loadFeed();
        }
      } else {
        throw new Error('Failed to submit complaint');
      }
    } catch (error) {
      alert(`Error submitting complaint: ${error.message}`);
      setFormData(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleMessageChange = (event) => {
    setFormData(prev => ({ ...prev, message: event.target.value }));
  };

  return createElement('form', { 
    className: 'complaint-form',
    onSubmit: handleSubmit
  },
    createElement('div', { className: 'form-group' },
      createElement('label', { htmlFor: 'message' }, 'Your Complaint'),
      createElement('textarea', {
        id: 'message',
        name: 'message',
        value: formData.message,
        onChange: handleMessageChange,
        placeholder: 'File your complaint. Shift+Enter for newline.',
        rows: 8,
        maxLength: 10000,
        required: true
      })
    ),
    
    // Hidden honeypot field
    createElement('div', { className: 'hp' },
      createElement('input', {
        type: 'text',
        name: 'website',
        tabIndex: '-1',
        autoComplete: 'off'
      })
    ),
    
    createElement('div', { className: 'form-actions' },
      createElement('button', {
        type: 'submit',
        className: 'btn btn-primary',
        disabled: formData.isSubmitting
      }, formData.isSubmitting ? 'Submitting...' : 'File a Complaint →')
    )
  );
};

// ===== POST FORM COMPONENT =====

const PostForm = () => {
  const [formData, setFormData] = useState({
    content: '',
    isSubmitting: false
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.content.trim()) {
      alert('Please enter some content');
      return;
    }

    setFormData(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // TODO: Implement post submission
      console.log('Submitting post:', formData.content);
      
      // Reset form
      setFormData({ content: '', isSubmitting: false });
    } catch (error) {
      alert(`Error submitting post: ${error.message}`);
      setFormData(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleContentChange = (event) => {
    setFormData(prev => ({ ...prev, content: event.target.value }));
  };

  return createElement('form', { 
    className: 'post-form',
    onSubmit: handleSubmit
  },
    createElement('div', { className: 'form-group' },
      createElement('label', { htmlFor: 'content' }, 'Your Complaint'),
      createElement('textarea', {
        id: 'content',
        value: formData.content,
        onChange: handleContentChange,
        placeholder: 'Write your anonymous complaint here...',
        rows: 8,
        maxLength: 10000,
        required: true
      })
    ),
    
    createElement('div', { className: 'form-actions' },
      createElement('button', {
        type: 'submit',
        className: 'btn btn-primary',
        disabled: formData.isSubmitting
      }, formData.isSubmitting ? 'Submitting...' : 'Submit Post')
    )
  );
};

// ===== EXPORTS =====

export { App, PostForm, ComplaintForm };
