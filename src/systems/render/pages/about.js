import { createElement, useEffect } from '../jsx.js';

// About Page Component
const AboutPage = () => {
  // Load chart when component mounts
  useEffect(() => {
    const loadChart = async () => {
      try {
        // Import and run chart functionality
        const chartModule = await import('../../../core/utils/chart.js');
        if (chartModule.default) {
          chartModule.default();
        }
      } catch (error) {
        console.error('Failed to load chart:', error);
      }
    };
    
    loadChart();
  }, []);
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

export { AboutPage };
