import { createElement } from '../jsx.js';

// Home Page Component
const HomePage = () => {
  return createElement('div', { className: 'page home-page' },
    createElement('div', { className: 'hero-section' },
      createElement('h2', null, 'Welcome to Karen on SUI'),
      createElement('p', { className: 'app-subtitle' }, 'Anonymous Complaints Platform'),
      createElement('p', null, 
        'A platform for anonymous complaints on the SUI blockchain. Connect your wallet to start posting, favoriting, and flagging content with KRN tokens.'
      ),
      createElement('p', null, 'Connect your wallet to get started.')
    ),
    
    // Info Containers
    createElement('div', { className: 'info-containers' },
      createElement('div', { className: 'info-container' },
        createElement('div', { className: 'info-icon' }, '🏢'),
        createElement('h3', null, 'DAO Governance'),
        createElement('p', null, 
          'Community-driven moderation through KRN token voting. Every action contributes to the governance of the platform.'
        )
      ),
      
      createElement('div', { className: 'info-container' },
        createElement('div', { className: 'info-icon' }, '⚡'),
        createElement('h3', null, 'SUI Blockchain'),
        createElement('p', null, 
          'Built on the high-performance SUI blockchain for instant transactions and transparent, immutable records.'
        )
      ),
      
      createElement('div', { className: 'info-container' },
        createElement('div', { className: 'info-icon' }, '🤖'),
        createElement('h3', null, 'AI Manager'),
        createElement('p', null, 
          'Connect with our AI manager for help, questions, or to learn more about the Karen on SUI platform.'
        )
      )
    )
  );
};

export { HomePage };
