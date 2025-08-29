import { createElement } from '../jsx.js';

// Terms of Service Page Component
const TermsPage = () => {
  return createElement('div', { className: 'page terms-page' },
    createElement('div', { className: 'hero-section' },
      createElement('h2', null, 'Terms of Service'),
      createElement('p', null, 
        'Please read these terms carefully before using the Karen On SUI platform.'
      )
    ),
    
    createElement('div', { className: 'terms-content' },
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '1. Acceptance of Terms'),
        createElement('p', null, 
          'By accessing and using the Karen On SUI platform ("Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '2. Description of Service'),
        createElement('p', null, 
          'Karen On SUI is a decentralized anonymous complaints platform built on the SUI blockchain that allows users to:'
        ),
        createElement('ul', null,
          createElement('li', null, 'Submit anonymous complaints and content'),
          createElement('li', null, 'Participate in community moderation through token-backed actions'),
          createElement('li', null, 'Engage in peer review and integrity scoring'),
          createElement('li', null, 'Interact with AI-powered chat functionality'),
          createElement('li', null, 'Use KRN tokens for platform actions')
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '3. User Responsibilities'),
        createElement('h4', null, '3.1 Anonymous Content'),
        createElement('ul', null,
          createElement('li', null, 'Users may submit complaints anonymously'),
          createElement('li', null, 'All content must comply with community standards'),
          createElement('li', null, 'No personal identifiable information (PII) should be included'),
          createElement('li', null, 'Content must not violate laws or regulations')
        ),
        createElement('h4', null, '3.2 Token Usage'),
        createElement('ul', null,
          createElement('li', null, 'KRN tokens are required for certain platform actions'),
          createElement('li', null, 'Users are responsible for their own wallet security'),
          createElement('li', null, 'Token transactions are irreversible'),
          createElement('li', null, 'Platform actions have associated costs in KRN tokens')
        ),
        createElement('h4', null, '3.3 Community Moderation'),
        createElement('ul', null,
          createElement('li', null, 'Users can participate in content moderation'),
          createElement('li', null, 'Star and flag actions help maintain community integrity'),
          createElement('li', null, 'Moderation actions require KRN token expenditure'),
          createElement('li', null, 'Users should act fairly and responsibly')
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '4. Platform Features'),
        createElement('h4', null, '4.1 Enhanced Complaint System'),
        createElement('ul', null,
          createElement('li', null, 'Anonymous complaint submission'),
          createElement('li', null, 'Advanced pagination and sorting'),
          createElement('li', null, 'Real-time star and flag interactions'),
          createElement('li', null, 'Content filtering and moderation')
        ),
        createElement('h4', null, '4.2 AI Chat Integration'),
        createElement('ul', null,
          createElement('li', null, 'KRN Bot provides AI-powered assistance'),
          createElement('li', null, 'Chat functionality for platform guidance'),
          createElement('li', null, 'Real-time streaming responses'),
          createElement('li', null, 'Community support through AI interaction')
        ),
        createElement('h4', null, '4.3 Blockchain Integration'),
        createElement('ul', null,
          createElement('li', null, 'Built on SUI blockchain'),
          createElement('li', null, 'Transparent and immutable records'),
          createElement('li', null, 'Wallet integration for token management'),
          createElement('li', null, 'Decentralized governance capabilities')
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '5. Privacy and Data'),
        createElement('h4', null, '5.1 Anonymous Participation'),
        createElement('ul', null,
          createElement('li', null, 'Users can participate without revealing identity'),
          createElement('li', null, 'Optional wallet address association'),
          createElement('li', null, 'No personal data collection'),
          createElement('li', null, 'Content is publicly visible but anonymous')
        ),
        createElement('h4', null, '5.2 Blockchain Transparency'),
        createElement('ul', null,
          createElement('li', null, 'All transactions are publicly visible on SUI blockchain'),
          createElement('li', null, 'Complaint content is stored on-chain'),
          createElement('li', null, 'Moderation actions are transparent'),
          createElement('li', null, 'No private data storage')
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '6. Token Economics'),
        createElement('h4', null, '6.1 KRN Token Usage'),
        createElement('ul', null,
          createElement('li', null, 'Stars and flags require KRN token expenditure'),
          createElement('li', null, 'Content moderation actions have associated costs'),
          createElement('li', null, 'Token distribution supports platform development'),
          createElement('li', null, 'Community integrity fund allocation')
        ),
        createElement('h4', null, '6.2 Token Distribution'),
        createElement('ul', null,
          createElement('li', null, '30% to Company Treasury'),
          createElement('li', null, '5% to Developer Fund'),
          createElement('li', null, '5% to Burn (deflationary)'),
          createElement('li', null, '60% to Community Integrity Fund')
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '7. Content Moderation'),
        createElement('h4', null, '7.1 Community Standards'),
        createElement('ul', null,
          createElement('li', null, 'No harassment or hate speech'),
          createElement('li', null, 'No illegal content'),
          createElement('li', null, 'No spam or malicious content'),
          createElement('li', null, 'Respect for community guidelines')
        ),
        createElement('h4', null, '7.2 Moderation Actions'),
        createElement('ul', null,
          createElement('li', null, 'Users can flag inappropriate content'),
          createElement('li', null, 'Community-driven moderation decisions'),
          createElement('li', null, 'Automatic flagging after threshold'),
          createElement('li', null, 'Content removal and user banning capabilities')
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '8. Disclaimers'),
        createElement('h4', null, '8.1 Platform Availability'),
        createElement('ul', null,
          createElement('li', null, 'Service provided "as is"'),
          createElement('li', null, 'No guarantee of continuous availability'),
          createElement('li', null, 'Platform may be modified or discontinued'),
          createElement('li', null, 'Users responsible for backup of important data')
        ),
        createElement('h4', null, '8.2 Financial Risks'),
        createElement('ul', null,
          createElement('li', null, 'KRN token values may fluctuate'),
          createElement('li', null, createElement('strong', null, 'Not financial advice. Tokens are risky; do your own research.')),
          createElement('li', null, 'Users responsible for their own financial decisions'),
          createElement('li', null, 'Platform not responsible for token value changes')
        ),
        createElement('h4', null, '8.3 Content Liability'),
        createElement('ul', null,
          createElement('li', null, createElement('strong', null, 'Submissions are anonymous and user-generated.')),
          createElement('li', null, createElement('strong', null, 'We do not endorse or verify any content. Do not include personal information, unlawful, or harmful material.')),
          createElement('li', null, 'Users responsible for their own content'),
          createElement('li', null, 'Platform does not endorse user content'),
          createElement('li', null, 'No guarantee of content accuracy'),
          createElement('li', null, 'Users liable for their submissions')
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '9. Limitation of Liability'),
        createElement('p', null, 
          'Karen On SUI and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.'
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '10. Indemnification'),
        createElement('p', null, 
          'You agree to defend, indemnify, and hold harmless Karen On SUI from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the platform.'
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '11. Governing Law'),
        createElement('p', null, 
          'These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where the platform operates, without regard to its conflict of law provisions.'
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '12. Changes to Terms'),
        createElement('p', null, 
          'Karen On SUI reserves the right to modify these terms at any time. Users will be notified of significant changes, and continued use constitutes acceptance of new terms.'
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '13. Contact Information'),
        createElement('p', null, 
          'For questions about these Terms of Service, please contact the Karen On SUI team through the platform\'s community channels.'
        )
      ),
      
      createElement('div', { className: 'terms-section' },
        createElement('h3', null, '14. Severability'),
        createElement('p', null, 
          'If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the Terms will otherwise remain in full force and effect.'
        )
      ),
      
      createElement('div', { className: 'terms-footer' },
        createElement('p', { className: 'terms-signature' }, 
          'Karen On SUI - Anonymous Complaint Revolution'
        ),
        createElement('p', { className: 'terms-signature' }, 
          'Built on the SUI Blockchain'
        ),
        createElement('p', { className: 'terms-signature' }, 
          '$KRN Token Ecosystem'
        ),
        createElement('p', { className: 'terms-date' }, 
          'Effective Date: March 1, 2024'
        )
      )
    )
  );
};

export { TermsPage };
