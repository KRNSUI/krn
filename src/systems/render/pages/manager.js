import { createElement, useState, useEffect } from '../jsx.js';

// Manager Page Component (krnbot)
const ManagerPage = () => {
  const [chatState, setChatState] = useState({
    messages: [],
    inputValue: '',
    isConnected: false,
    isStreaming: false,
    error: null
  });

  const addMessage = (role, content) => {
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, { role, content, id: Date.now() }]
    }));
  };

  const handleSendMessage = async () => {
    if (!chatState.inputValue.trim() || chatState.isStreaming) return;

    const userMessage = chatState.inputValue.trim();
    setChatState(prev => ({
      ...prev,
      inputValue: '',
      isStreaming: true,
      error: null
    }));

    addMessage('user', userMessage);

    try {
      const response = await fetch('/api/krnbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        
        // Update the last message or create a new one
        setChatState(prev => {
          const newMessages = [...prev.messages];
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = assistantMessage;
          } else {
            newMessages.push({ role: 'assistant', content: assistantMessage, id: Date.now() });
          }
          
          return { ...prev, messages: newMessages };
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatState(prev => ({
        ...prev,
        error: 'Failed to send message. Please try again.'
      }));
    } finally {
      setChatState(prev => ({ ...prev, isStreaming: false }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setChatState(prev => ({ ...prev, messages: [] }));
  };

  return createElement('div', { className: 'page manager-page' },
    createElement('div', { className: 'hero-section' },
      createElement('h2', null, 'Speak to the Manager'),
      createElement('p', null, 
        'Complain to the Chain. For those that want to speak with the Manager.'
      )
    ),
    
    createElement('div', { className: 'manager-info', style: 'text-align: center; margin-bottom: 2rem;' },
      createElement('img', {
        src: 'https://pbs.twimg.com/profile_images/1959020302773755905/w-bp7w5i_400x400.jpg',
        alt: 'KRN Manager',
        style: 'width: 96px; height: 96px; border-radius: 50%; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.4);'
      }),
      createElement('h2', { 
        style: 'margin: 0.5rem 0 0.25rem; font-size: 1.75rem; letter-spacing: 0.4px; line-height: 1.2; background: linear-gradient(90deg, var(--acc2), var(--acc1) 40%, var(--acc3)); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 8px rgba(255,174,66,0.3));'
      }, 'Complain to the Chain'),
      createElement('p', { 
        style: 'margin: 0.25rem 0 0; color: var(--text-secondary); font-size: 1rem;'
      }, 'For those that want to speak with the Manager')
    ),
    
    createElement('div', { className: 'chat-interface' },
      // Chat messages
      createElement('div', { 
        className: 'chat-messages',
        style: 'height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; background: var(--bg-secondary); margin-bottom: 1rem;'
      },
        chatState.messages.length === 0 ? 
          createElement('p', { 
            style: 'text-align: center; color: var(--text-secondary); font-style: italic;'
          }, 'Start your complaint below...') :
          chatState.messages.map(msg => 
            createElement('div', { 
              key: msg.id,
              className: `chat-message ${msg.role}`,
              style: `margin-bottom: 1rem; display: flex; justify-content: ${msg.role === 'user' ? 'flex-end' : 'flex-start'};`
            },
              createElement('div', {
                style: `max-width: 70%; padding: 0.75rem 1rem; border-radius: 12px; background: ${msg.role === 'user' ? 'var(--accent-color)' : 'var(--bg-primary)'}; color: ${msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)'}; border: 1px solid ${msg.role === 'user' ? 'var(--accent-color)' : 'var(--border-color)'};`
              }, msg.content)
            )
          )
      ),
      
      // Error message
      chatState.error && createElement('div', {
        style: 'color: var(--error-color); margin-bottom: 1rem; padding: 0.5rem; background: rgba(255, 107, 107, 0.1); border-radius: 4px;'
      }, chatState.error),
      
      // Chat controls
      createElement('div', { 
        className: 'chat-controls',
        style: 'display: flex; gap: 0.5rem; align-items: flex-end;'
      },
        createElement('textarea', {
          value: chatState.inputValue,
          onChange: (e) => setChatState(prev => ({ ...prev, inputValue: e.target.value })),
          onKeyPress: handleKeyPress,
          placeholder: 'File your complaint. Shift+Enter for newline.',
          disabled: chatState.isStreaming,
          style: 'flex: 1; min-height: 3rem; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); resize: vertical;'
        }),
        createElement('button', {
          onClick: handleSendMessage,
          disabled: !chatState.inputValue.trim() || chatState.isStreaming,
          style: 'padding: 0.75rem 1rem; border-radius: 8px; border: none; background: var(--accent-color); color: var(--bg-primary); font-weight: bold; cursor: pointer; white-space: nowrap;'
        }, chatState.isStreaming ? 'Sending...' : 'Send'),
        createElement('button', {
          onClick: clearChat,
          style: 'padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer;'
        }, 'Clear')
      )
    )
  );
};

export { ManagerPage };
