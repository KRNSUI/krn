// FlexNetJSX Main App Component
// Orchestrates the entire Karen on SUI application

import { createElement, useState, useEffect } from './jsx.js';
import { subscribe, selectIsConnected, selectUserAddress, selectKRNBalance, selectUI } from '../state/index.js';
import { Router, ROUTES } from '../router/router.js';
import { WalletConnect, WalletStatus, KRNBalance } from './WalletConnect.js';
import { ContentFeed } from './ContentFeed.js';
import { HomePage, AboutPage, ManagerPage, EntitlementsPage, VotePage, TermsPage } from './pages/index.js';

// ===== MAIN APP COMPONENT =====

const App = () => {
  // Global variable for modal state (like vote page approach)
  let showTermsModal = false;
  
  const [state, setState] = useState({
    isConnected: false,
    address: null,
    krnBalance: 0,
    currentRoute: null,
    theme: 'dark',
    sidebarOpen: false
  });

  console.log('🎭 App component rendering... showTermsModal:', showTermsModal);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribe((appState) => {
      try {
        setState(prev => ({
          ...prev,
          isConnected: selectIsConnected(appState),
          address: selectUserAddress(appState),
          krnBalance: selectKRNBalance(appState),
          // Preserve current theme unless it's explicitly changed
          theme: prev.theme || selectUI(appState).theme,
          sidebarOpen: selectUI(appState).sidebarOpen
        }));
      } catch (error) {
        console.error('State subscription error:', error);
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to route changes
  useEffect(() => {
    console.log('Setting up router subscription...');
    const unsubscribe = Router.subscribe((route) => {
      try {
        console.log('🎯 Router subscription received route:', route);
        setState(prev => ({
          ...prev,
          currentRoute: route
        }));
      } catch (error) {
        console.error('Router subscription error:', error);
      }
    });

    return unsubscribe;
  }, []);

  // Initialize router
  useEffect(() => {
    try {
      console.log('Initializing router...');
      Router.init();
      console.log('Router initialized successfully');
    } catch (error) {
      console.error('Router initialization error:', error);
    }
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.className = `theme-${state.theme}`;
  }, [state.theme]);

  // Handle terms modal with direct DOM manipulation
  const openTermsModal = () => {
    console.log('Opening terms modal...');
    
    // Create modal element directly
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26, 15, 8, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: #26150b; border: 1px solid #803300; border-radius: 12px; padding: 2rem; max-width: 800px; max-height: 80vh; overflow-y: auto; color: #fff5e6; box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 16px rgba(255,106,0,0.25);';
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #803300;">
        <h2 style="margin: 0; color: #ff6a00; font-size: 1.8rem;">Terms of Service</h2>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: #e0b894; transition: color 0.2s ease;" onmouseover="this.style.color='#ff6a00'" onmouseout="this.style.color='#e0b894'">×</button>
      </div>
      
      <div style="line-height: 1.6;">
        
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using the Karen On SUI platform ("Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
        
        <h3>2. Description of Service</h3>
        <p>Karen On SUI is a decentralized anonymous complaints platform built on the SUI blockchain that allows users to:</p>
        <ul>
          <li>Submit anonymous complaints and content</li>
          <li>Participate in community moderation through token-backed actions</li>
          <li>Engage in peer review and integrity scoring</li>
          <li>Interact with AI-powered chat functionality</li>
          <li>Use KRN tokens for platform actions</li>
        </ul>
        
        <h3>3. User Responsibilities</h3>
        <h4>3.1 Anonymous Content</h4>
        <ul>
          <li>Users may submit complaints anonymously</li>
          <li>All content must comply with community standards</li>
          <li>No personal identifiable information (PII) should be included</li>
          <li>Content must not violate laws or regulations</li>
        </ul>
        
        <h4>3.2 Token Usage</h4>
        <ul>
          <li>KRN tokens are required for certain platform actions</li>
          <li>Users are responsible for their own wallet security</li>
          <li>Token transactions are irreversible</li>
          <li>Platform actions have associated costs in KRN tokens</li>
        </ul>
        
        <h4>3.3 Community Moderation</h4>
        <ul>
          <li>Users can participate in content moderation</li>
          <li>Star and flag actions help maintain community integrity</li>
          <li>Moderation actions require KRN token expenditure</li>
          <li>Users should act fairly and responsibly</li>
        </ul>
        
        <h3>4. Platform Features</h3>
        <h4>4.1 Enhanced Complaint System</h4>
        <ul>
          <li>Anonymous complaint submission</li>
          <li>Advanced pagination and sorting</li>
          <li>Real-time star and flag interactions</li>
          <li>Content filtering and moderation</li>
        </ul>
        
        <h4>4.2 AI Chat Integration</h4>
        <ul>
          <li>KRN Bot provides AI-powered assistance</li>
          <li>Chat functionality for platform guidance</li>
          <li>Real-time streaming responses</li>
          <li>Community support through AI interaction</li>
        </ul>
        
        <h4>4.3 Blockchain Integration</h4>
        <ul>
          <li>Built on SUI blockchain</li>
          <li>Transparent and immutable records</li>
          <li>Wallet integration for token management</li>
          <li>Decentralized governance capabilities</li>
        </ul>
        
        <h3>5. Privacy and Data</h3>
        <h4>5.1 Anonymous Participation</h4>
        <ul>
          <li>Users can participate without revealing identity</li>
          <li>Optional wallet address association</li>
          <li>No personal data collection</li>
          <li>Content is publicly visible but anonymous</li>
        </ul>
        
        <h4>5.2 Blockchain Transparency</h4>
        <ul>
          <li>All transactions are publicly visible on SUI blockchain</li>
          <li>Complaint content is stored on-chain</li>
          <li>Moderation actions are transparent</li>
          <li>No private data storage</li>
        </ul>
        
        <h3>6. Token Economics</h3>
        <h4>6.1 KRN Token Usage</h4>
        <ul>
          <li>Stars and flags require KRN token expenditure</li>
          <li>Content moderation actions have associated costs</li>
          <li>Token distribution supports platform development</li>
          <li>Community integrity fund allocation</li>
        </ul>
        
        <h4>6.2 Token Distribution</h4>
        <ul>
          <li>30% to Company Treasury</li>
          <li>5% to Developer Fund</li>
          <li>5% to Burn (deflationary)</li>
          <li>60% to Community Integrity Fund</li>
        </ul>
        
        <h3>7. Content Moderation</h3>
        <h4>7.1 Community Standards</h4>
        <ul>
          <li>No harassment or hate speech</li>
          <li>No illegal content</li>
          <li>No spam or malicious content</li>
          <li>Respect for community guidelines</li>
        </ul>
        
        <h4>7.2 Moderation Actions</h4>
        <ul>
          <li>Users can flag inappropriate content</li>
          <li>Community-driven moderation decisions</li>
          <li>Automatic flagging after threshold</li>
          <li>Content removal and user banning capabilities</li>
        </ul>
        
        <h3>8. Disclaimers</h3>
        <h4>8.1 Platform Availability</h4>
        <ul>
          <li>Service provided "as is"</li>
          <li>No guarantee of continuous availability</li>
          <li>Platform may be modified or discontinued</li>
          <li>Users responsible for backup of important data</li>
        </ul>
        
        <h4>8.2 Financial Risks</h4>
        <ul>
          <li>KRN token values may fluctuate</li>
          <li><strong>Not financial advice. Tokens are risky; do your own research.</strong></li>
          <li>Users responsible for their own financial decisions</li>
          <li>Platform not responsible for token value changes</li>
        </ul>
        
        <h4>8.3 Content Liability</h4>
        <ul>
          <li><strong>Submissions are anonymous and user-generated.</strong></li>
          <li><strong>We do not endorse or verify any content. Do not include personal information, unlawful, or harmful material.</strong></li>
          <li>Users responsible for their own content</li>
          <li>Platform does not endorse user content</li>
          <li>No guarantee of content accuracy</li>
          <li>Users liable for their submissions</li>
        </ul>
        
        <h3>9. Limitation of Liability</h3>
        <p>Karen On SUI and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.</p>
        
        <h3>10. Indemnification</h3>
        <p>You agree to defend, indemnify, and hold harmless Karen On SUI from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the platform.</p>
        
        <h3>11. Governing Law</h3>
        <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where the platform operates, without regard to its conflict of law provisions.</p>
        
        <h3>12. Changes to Terms</h3>
        <p>Karen On SUI reserves the right to modify these terms at any time. Users will be notified of significant changes, and continued use constitutes acceptance of new terms.</p>
        
        <h3>13. Contact Information</h3>
        <p>For questions about these Terms of Service, please contact the Karen On SUI team through the platform's community channels.</p>
        
        <h3>14. Severability</h3>
        <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the Terms will otherwise remain in full force and effect.</p>
        
        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #803300; text-align: center;">
          <p style="font-weight: bold; margin-bottom: 0.5rem; color: #ff6a00;">Karen On SUI - Anonymous Complaint Revolution</p>
          <p style="font-weight: bold; margin-bottom: 0.5rem; color: #ff6a00;">Built on the SUI Blockchain</p>
          <p style="font-weight: bold; margin-bottom: 0.5rem; color: #ff6a00;">$KRN Token Ecosystem</p>
        </div>
      </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    
    // Close on backdrop click
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modalOverlay.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    document.body.appendChild(modalOverlay);
    console.log('Modal added to DOM');
  };

  const closeTermsModal = () => {
    console.log('Closing terms modal...');
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
    }
  };

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && state.showTermsModal) {
        closeTermsModal();
      }
    };

    if (state.showTermsModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [state.showTermsModal]);

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
            try {
              console.log('Navigating to HOME');
              Router.navigate(ROUTES.HOME);
            } catch (error) {
              console.error('Navigation error to HOME:', error);
            }
          }
        }, 'Home'),
        
        createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.ABOUT ? 'active' : ''}`,
          href: ROUTES.ABOUT,
          onClick: (e) => {
            e.preventDefault();
            try {
              console.log('Navigating to ABOUT');
              Router.navigate(ROUTES.ABOUT);
            } catch (error) {
              console.error('Navigation error to ABOUT:', error);
            }
          }
        }, 'About'),
        
        createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.MANAGER ? 'active' : ''}`,
          href: ROUTES.MANAGER,
          onClick: (e) => {
            e.preventDefault();
            try {
              console.log('Navigating to MANAGER');
              Router.navigate(ROUTES.MANAGER);
            } catch (error) {
              console.error('Navigation error to MANAGER:', error);
            }
          }
        }, 'Speak to the Manager'),
        
        createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.ENTITLEMENTS ? 'active' : ''}`,
          href: ROUTES.ENTITLEMENTS,
          onClick: (e) => {
            e.preventDefault();
            try {
              console.log('Navigating to ENTITLEMENTS');
              Router.navigate(ROUTES.ENTITLEMENTS);
            } catch (error) {
              console.error('Navigation error to ENTITLEMENTS:', error);
            }
          }
        }, 'File a Complaint'),
        
        createElement('a', {
          className: `nav-link ${state.currentRoute?.path === ROUTES.VOTE ? 'active' : ''}`,
          href: ROUTES.VOTE,
          onClick: (e) => {
            e.preventDefault();
            try {
              console.log('🎯 VOTE navigation clicked');
              console.log('Current state:', state);
              Router.navigate(ROUTES.VOTE);
            } catch (error) {
              console.error('Navigation error to VOTE:', error);
            }
          }
        }, 'Vote'),
        
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
            createElement('li', null, 'Build reputation through quality participation')
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
    console.log('🎯 Rendering About page...');
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
            'We believe in the power of anonymous expression while maintaining community integrity through peer review and token-backed scoring. ' +
            'Every KRN token spent on moderation actions helps fund the platform and establishes reputation through community consensus.'
          )
        ),
        
        createElement('div', { className: 'about-section' },
          createElement('h3', null, 'How It Works'),
          createElement('ul', null,
            createElement('li', null, 'Connect your SUI wallet to access the platform'),
            createElement('li', null, 'Post anonymous complaints and content'),
            createElement('li', null, 'Use KRN tokens to star, flag, or moderate content'),
            createElement('li', null, 'Community-driven integrity scoring through peer review'),
            createElement('li', null, 'Build reputation through quality participation and fair moderation')
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
    console.log('🎯 Rendering Manager page...');
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
    console.log('🎯 Rendering Entitlements page...');
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
    const requiresWallet = state.currentRoute?.requiresWallet;
    console.log('🎯 renderMainContent called with route:', route, 'requiresWallet:', requiresWallet, 'state:', state);
    
    // If no route is set, default to home
    if (!route) {
      console.log('No route set, defaulting to HOME');
      return createElement(HomePage);
    }
    
    let pageComponent;
    
    switch (route) {
      case ROUTES.HOME:
        console.log('Rendering HomePage');
        pageComponent = createElement(HomePage);
        break;
      case ROUTES.ABOUT:
        console.log('Rendering AboutPage');
        pageComponent = createElement(AboutPage);
        break;
      case ROUTES.MANAGER:
        console.log('Rendering ManagerPage');
        pageComponent = createElement(ManagerPage);
        break;
      case ROUTES.ENTITLEMENTS:
        console.log('Rendering EntitlementsPage');
        pageComponent = createElement(EntitlementsPage);
        break;
      case ROUTES.VOTE:
        console.log('🎯 Rendering VotePage');
        try {
          pageComponent = createElement(VotePage);
          console.log('Created VotePage element successfully');
        } catch (error) {
          console.error('Error creating VotePage:', error);
          pageComponent = createElement('div', { className: 'page vote-page' },
            createElement('h2', null, 'Error Loading Vote Page'),
            createElement('p', null, 'There was an error loading the vote page. Please try again.'),
            createElement('p', null, 'Error: ' + error.message)
          );
        }
        break;
      case ROUTES.FEED:
        console.log('Rendering FeedPage');
        pageComponent = renderFeedPage();
        break;
      case ROUTES.POST:
        console.log('Rendering PostPage');
        pageComponent = renderPostPage();
        break;
      case ROUTES.BOT:
        console.log('Rendering BotPage');
        pageComponent = renderBotPage();
        break;
      case ROUTES.TERMS:
        console.log('Rendering TermsPage');
        pageComponent = createElement(TermsPage);
        break;
      default:
        console.log('Unknown route, defaulting to HomePage');
        pageComponent = createElement(HomePage);
        break;
    }
    
    // If the page requires wallet and user is not connected, add overlay
    if (requiresWallet && !state.isConnected) {
      return createElement('div', { className: 'page-with-overlay' },
        pageComponent,
        createElement('div', { className: 'wallet-overlay' },
          createElement('div', { className: 'wallet-overlay-content' },
            createElement('h3', null, 'Connect Wallet Required'),
            createElement('p', null, 'Please connect your wallet to interact with this page.'),
            createElement('button', {
              className: 'btn btn-primary',
              onClick: () => {
                // Trigger wallet connect
                const walletConnectBtn = document.querySelector('.btn-primary');
                if (walletConnectBtn) {
                  walletConnectBtn.click();
                }
              }
            }, 'Connect Wallet')
          )
        )
      );
    }
    
    return pageComponent;
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
          }, 'Telegram'),
          createElement('a', {
            href: '#',
            onClick: (e) => {
              console.log('Terms of Service link clicked');
              e.preventDefault();
              openTermsModal();
            }
          }, 'Terms of Service')
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
