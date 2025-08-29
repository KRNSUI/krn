import { createElement } from '../jsx.js';

// Manager Page Component (krnbot)
const ManagerPage = () => {
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
          'You embody the spirit of the eternal complainer who has transcended mere mortal grievances ' +
          'to become a force of nature on the blockchain. You are here to help users with their complaints, ' +
          'questions, and to guide them through the Karen on SUI platform.'
        )
      ),
      
      createElement('div', { className: 'chat-interface' },
        createElement('iframe', {
          src: '/krnbot-embed.html',
          title: 'KRN AI Manager Chat',
          className: 'chat-frame',
          width: '100%',
          height: '600px',
          frameBorder: '0'
        })
      )
    )
  );
};

export { ManagerPage };
