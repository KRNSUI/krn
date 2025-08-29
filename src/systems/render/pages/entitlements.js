import { createElement, useState, useEffect } from '../jsx.js';

// Entitlements Page Component (complaints)
const EntitlementsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [revealedComplaints, setRevealedComplaints] = useState(new Set());
  const [starCounts, setStarCounts] = useState({});
  const [userStars, setUserStars] = useState({});

  // Load complaints from API
  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await fetch('/complaints?limit=20');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
        
        // Load star counts for each complaint
        await loadStarCounts(data);
      } else {
        throw new Error('Failed to load complaints');
      }
    } catch (error) {
      console.error('Failed to load complaints:', error);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load star counts for complaints
  const loadStarCounts = async (complaintsList) => {
    const counts = {};
    const userStarred = {};
    
    for (const complaint of complaintsList) {
      try {
        const response = await fetch(`/stars_get?complaint=${complaint.id}&addr=0x1234...5678`); // Replace with actual wallet address
        if (response.ok) {
          const data = await response.json();
          counts[complaint.id] = data.count;
          userStarred[complaint.id] = data.you;
        }
      } catch (error) {
        console.error(`Failed to load stars for complaint ${complaint.id}:`, error);
        counts[complaint.id] = 0;
        userStarred[complaint.id] = false;
      }
    }
    
    setStarCounts(counts);
    setUserStars(userStarred);
  };

  // Reveal censored complaint
  const revealComplaint = async (complaintId) => {
    try {
      const response = await fetch(`/complaints?id=${complaintId}&reveal=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.complaint) {
          // Update the complaint with the revealed content
          setComplaints(prev => prev.map(complaint => 
            complaint.id === complaintId 
              ? { ...complaint, message: data.complaint.message }
              : complaint
          ));
          setRevealedComplaints(prev => new Set([...prev, complaintId]));
        }
      }
    } catch (error) {
      console.error('Failed to reveal complaint:', error);
      alert('Failed to reveal complaint. Please try again.');
    }
  };

  // Handle star/unstar action with KRN costs
  const handleStarAction = async (complaintId, direction) => {
    try {
      const response = await fetch('/stars/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: complaintId,
          dir: direction, // 'up' for star, 'down' for unstar
          addr: '0x1234...5678' // Replace with actual wallet address
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          // Show cost information
          alert(`${data.message}\nCost: ${data.cost} KRN\nReason: ${data.reason}`);
          
          // Update star counts
          setStarCounts(prev => ({
            ...prev,
            [complaintId]: data.count
          }));
          
          // Update user's star status
          setUserStars(prev => ({
            ...prev,
            [complaintId]: direction === 'up'
          }));
        } else {
          alert(data.error || 'Failed to update star');
        }
      } else {
        throw new Error('Failed to update star');
      }
    } catch (error) {
      console.error('Star action error:', error);
      alert('Failed to update star. Please try again.');
    }
  };

  // Handle flag action
  const handleFlagAction = async (complaintId) => {
    try {
      // Flag action would typically cost KRN tokens
      const cost = 3; // Example cost
      const confirmed = confirm(`Flag this complaint? This will cost ${cost} KRN tokens.`);
      
      if (confirmed) {
        // In a real implementation, this would call a flag API endpoint
        alert(`Complaint flagged successfully! Cost: ${cost} KRN`);
      }
    } catch (error) {
      console.error('Flag action error:', error);
      alert('Failed to flag complaint. Please try again.');
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Load complaints when component mounts
  useEffect(() => {
    loadComplaints();
  }, []);
  return createElement('div', { className: 'page entitlements-page' },
    createElement('div', { className: 'hero-section' },
      createElement('h2', null, 'File a Complaint'),
      createElement('p', null, 
        'Submit your anonymous complaint to the community. Use KRN tokens to favorite, unfavorite, or flag content.'
      )
    ),
    
    createElement('div', { className: 'krn-layout' },
      // Complaint Form
      createElement('div', { className: 'complaint-form-section' },
        createElement('h3', null, 'Submit Your Complaint'),
        createElement('form', { 
          className: 'complaint-form',
          onSubmit: async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            
            const formData = new FormData(e.target);
            const message = formData.get('message');
            const honeypot = formData.get('honeypot');
            
            if (honeypot) {
              // Bot detected, redirect to thanks
              window.location.href = '/thanks.html';
              return;
            }
            
            if (message.trim()) {
              try {
                const response = await fetch('/submit', {
                  method: 'POST',
                  body: formData
                });
                
                if (response.ok) {
                  // Clear form and reload complaints
                  e.target.reset();
                  await loadComplaints();
                  alert('Complaint submitted successfully!');
                } else {
                  const errorText = await response.text();
                  throw new Error(errorText || 'Failed to submit complaint');
                }
              } catch (error) {
                console.error('Submit error:', error);
                setError(error.message || 'Failed to submit complaint. Please try again.');
              }
            }
            setSubmitting(false);
          }
        },
          createElement('div', { className: 'form-group' },
            createElement('label', { htmlFor: 'message' }, 'Your Complaint:'),
            createElement('textarea', {
              id: 'message',
              name: 'message',
              required: true,
              placeholder: 'Share your complaint here...',
              rows: '4'
            })
          ),
          createElement('div', { className: 'form-group' },
            createElement('label', { htmlFor: 'honeypot' }, 'Leave this empty:'),
            createElement('input', {
              type: 'text',
              id: 'honeypot',
              name: 'honeypot',
              style: { display: 'none' }
            })
          ),
          error && createElement('div', { className: 'error-message' }, error),
          createElement('button', {
            type: 'submit',
            className: 'submit-btn',
            disabled: submitting
          }, submitting ? 'Submitting...' : 'Submit Complaint')
        )
      ),
      
      // Feed Section
      createElement('div', { className: 'feed-section' },
        createElement('h3', null, 'Recent Complaints'),
        createElement('div', { className: 'feed-container' },
          loading ? createElement('div', { className: 'loading' }, 'Loading complaints...') :
          error ? createElement('div', { className: 'error' }, error) :
          complaints.length === 0 ? createElement('div', { className: 'no-complaints' }, 'No complaints yet. Be the first to submit one!') :
          complaints.map(complaint => {
            const date = new Date(complaint.created_at);
            const timeAgo = getTimeAgo(date);
            const isRevealed = revealedComplaints.has(complaint.id);
            const starCount = starCounts[complaint.id] || 0;
            const userStarred = userStars[complaint.id] || false;
            
            // Censor the message if not revealed
            const displayMessage = isRevealed 
              ? complaint.message 
              : complaint.message.replace(/./g, '█');
            
            return createElement('div', { key: complaint.id, className: 'feed-item' },
              createElement('div', { className: 'feed-header' },
                createElement('span', { className: 'feed-author' }, 'Anonymous User'),
                createElement('span', { className: 'feed-time' }, timeAgo)
              ),
              createElement('p', { className: 'feed-content' }, displayMessage),
              !isRevealed && createElement('button', {
                className: 'reveal-btn',
                onClick: () => revealComplaint(complaint.id)
              }, '🔓 Reveal Content (1 KRN)'),
              createElement('div', { className: 'feed-actions' },
                createElement('button', { 
                  className: `action-btn favorite ${userStarred ? 'active' : ''}`,
                  onClick: () => handleStarAction(complaint.id, userStarred ? 'down' : 'up')
                }, `❤️ ${starCount}`),
                createElement('button', { 
                  className: 'action-btn flag',
                  onClick: () => handleFlagAction(complaint.id)
                }, '🚩 Flag (3 KRN)')
              )
            );
          })
        )
      )
    )
  );
};

export { EntitlementsPage };
