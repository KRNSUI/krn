import { createElement } from '../jsx.js';

// Voting Page Component
const VotePage = () => {
  // Use a simple variable instead of useState to avoid re-rendering issues
  let activeTab = 'favorited';
  let selectedItem = null;
  
  // Sample data - in real app this would come from the database
  const voteData = {
    favorited: [
      { id: 1, content: 'This complaint has the most favorites', author: '0x1234...5678', favorites: 25, dislikes: 2, flags: 1, strikes: 0 },
      { id: 2, content: 'Second most favorited complaint', author: '0x8765...4321', favorites: 18, dislikes: 1, flags: 0, strikes: 0 },
      { id: 3, content: 'Third most favorited complaint', author: '0x1111...2222', favorites: 12, dislikes: 3, flags: 2, strikes: 1 }
    ],
    disliked: [
      { id: 4, content: 'This complaint has the most dislikes', author: '0x3333...4444', favorites: 1, dislikes: 15, flags: 8, strikes: 2 },
      { id: 5, content: 'Second most disliked complaint', author: '0x5555...6666', favorites: 2, dislikes: 12, flags: 5, strikes: 1 },
      { id: 6, content: 'Third most disliked complaint', author: '0x7777...8888', favorites: 0, dislikes: 9, flags: 3, strikes: 0 }
    ],
    flagged: [
      { id: 7, content: 'This complaint has the most flags', author: '0x9999...0000', favorites: 0, dislikes: 5, flags: 20, strikes: 3 },
      { id: 8, content: 'Second most flagged complaint', author: '0xaaaa...bbbb', favorites: 1, dislikes: 3, flags: 15, strikes: 2 },
      { id: 9, content: 'Third most flagged complaint', author: '0xcccc...dddd', favorites: 2, dislikes: 2, flags: 10, strikes: 1 }
    ]
  };

  const handleModerationAction = (action, item) => {
    selectedItem = item;
    console.log(`Moderation action: ${action} on item ${item.id} by ${item.author}`);
    
    // In real app, this would trigger a KRN transaction
    if (action === 'remove') {
      alert(`Remove complaint: "${item.content.substring(0, 50)}..."\nThis will cost 5 KRN tokens.`);
    } else if (action === 'ban') {
      alert(`Ban wallet address: ${item.author}\nThis will cost 10 KRN tokens.\nStrikes: ${item.strikes}/3`);
    } else if (action === 'approve') {
      alert(`Approve complaint: "${item.content.substring(0, 50)}..."\nThis will cost 2 KRN tokens.`);
    }
  };

  const renderVoteTabs = () => {
    return createElement('div', { className: 'vote-tabs' },
      createElement('button', {
        className: `vote-tab ${activeTab === 'favorited' ? 'active' : ''}`,
        onClick: () => {
          activeTab = 'favorited';
          console.log('Switched to favorited tab');
        }
      }, 'Most Favorited'),
      createElement('button', {
        className: `vote-tab ${activeTab === 'disliked' ? 'active' : ''}`,
        onClick: () => {
          activeTab = 'disliked';
          console.log('Switched to disliked tab');
        }
      }, 'Most Disliked'),
      createElement('button', {
        className: `vote-tab ${activeTab === 'flagged' ? 'active' : ''}`,
        onClick: () => {
          activeTab = 'flagged';
          console.log('Switched to flagged tab');
        }
      }, 'Most Flagged')
    );
  };

  const renderVoteItems = () => {
    const items = voteData[activeTab];
    
    return createElement('div', { className: 'vote-items' },
      items.map(item => 
        createElement('div', { key: item.id, className: 'vote-item' },
          createElement('div', { className: 'vote-item-header' },
            createElement('span', { className: 'vote-author' }, item.author),
            createElement('span', { className: 'vote-strikes' }, `Strikes: ${item.strikes}/3`)
          ),
          createElement('p', { className: 'vote-content' }, item.content),
          createElement('div', { className: 'vote-stats' },
            createElement('span', { className: 'vote-stat' }, `❤️ ${item.favorites}`),
            createElement('span', { className: 'vote-stat' }, `👎 ${item.dislikes}`),
            createElement('span', { className: 'vote-stat' }, `🚩 ${item.flags}`)
          ),
          createElement('div', { className: 'vote-actions' },
            createElement('button', {
              className: 'vote-action-btn remove',
              onClick: () => handleModerationAction('remove', item)
            }, 'Remove Content'),
            createElement('button', {
              className: 'vote-action-btn ban',
              onClick: () => handleModerationAction('ban', item)
            }, 'Ban Wallet Address'),
            createElement('button', {
              className: 'vote-action-btn approve',
              onClick: () => handleModerationAction('approve', item)
            }, 'Approve Content')
          )
        )
      )
    );
  };

  return createElement('div', { className: 'page vote-page' },
    createElement('div', { className: 'hero-section' },
      createElement('h2', null, 'Community Moderation'),
      createElement('p', null, 
        'Vote on content moderation actions. Use KRN tokens to remove content, ban wallet addresses, or approve content.'
      )
    ),
    
    createElement('div', { className: 'vote-content' },
      createElement('div', { className: 'vote-header' },
        createElement('h3', null, 'Top Voted Content'),
        createElement('p', null, 
          'Review the most favorited, disliked, and flagged complaints. Take moderation actions using KRN tokens.'
        )
      ),
      
      renderVoteTabs(),
      renderVoteItems(),
      
      createElement('div', { className: 'vote-info' },
        createElement('h4', null, 'Moderation Costs:'),
        createElement('ul', null,
          createElement('li', null, 'Remove Content: 5 KRN'),
          createElement('li', null, 'Ban Wallet Address: 10 KRN'),
          createElement('li', null, 'Approve Content: 2 KRN')
        ),
        createElement('p', { className: 'vote-note' }, 
          'Wallet addresses are banned after 3 strikes. Banned addresses cannot post or interact with the platform.'
        )
      )
    )
  );
};

export { VotePage };
