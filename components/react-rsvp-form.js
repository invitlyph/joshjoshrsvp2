// ============================================
// React RSVP Form Component
// Supports individuals and families/groups
// ============================================

;(function(){
  const { useState, useEffect, useCallback } = React;
  const { createPortal } = ReactDOM;
  const RESPONSE_ROTATION_DELAY = 9000;
  const MESSAGE_MAX_LENGTH = 320;
  const RSVP_API_ROUTE = '/api/rsvp';

  const STATUS_LABELS = {
    yes: 'We\'ll be there',
    no: 'Sending love',
    maybe: 'Still confirming'
  };

  function useResponsesFeed(){
    const [responses, setResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(true);
    const [responsesError, setResponsesError] = useState('');

    const fetchResponses = useCallback(async () => {
      setLoadingResponses(true);
      setResponsesError('');
      try {
        const response = await fetch(RSVP_API_ROUTE, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
          throw new Error('Request failed');
        }
        const payload = await response.json();
        const sanitized = (payload.responses || []).filter(entry => {
          const msg = (entry.message || '').trim();
          return msg.length > 0;
        });
        setResponses(sanitized);
      } catch (err) {
        console.error('Failed to load responses', err);
        setResponsesError('Unable to load recent messages right now.');
      } finally {
        setLoadingResponses(false);
      }
    }, []);

    useEffect(() => {
      fetchResponses();
    }, [fetchResponses]);

    return { responses, loadingResponses, responsesError, fetchResponses };
  }

  function formatResponseDate(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function ResponseSpotlight({ responses, loadingResponses, responsesError }) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
      setActiveIndex(0);
    }, [responses.length]);

    useEffect(() => {
      if (responses.length <= 1) return;
      const timer = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % responses.length);
      }, RESPONSE_ROTATION_DELAY);
      return () => clearInterval(timer);
    }, [responses.length]);

    const container = document.getElementById('responseSpotlight');
    if (!container) return null;
    if (loadingResponses || responsesError || responses.length === 0) {
      return null;
    }

    const current = responses[activeIndex] || responses[0];
    if (!current) return null;

    const trimmedMessage = (current.message || '').trim();
    const responseMessage = trimmedMessage 
      ? '\u201C' + trimmedMessage + '\u201D'
      : '\u201CSharing their RSVP with Josh & Joy.\u201D';
    const responseDate = formatResponseDate(current.created_at);
    const nameSource = (current.name || '').trim();
    const firstName = nameSource ? nameSource.split(/\s+/)[0] : 'Guest';
    const nameDisplay = firstName ? '- ' + firstName : '';

    return createPortal(
      React.createElement('div', { className: 'response-spotlight-card card' },
        React.createElement('p', { className: 'response-spotlight-quote' }, responseMessage),
        React.createElement('div', { className: 'response-spotlight-meta' },
          nameDisplay && React.createElement('span', { className: 'response-spotlight-name' }, nameDisplay),
          responseDate && React.createElement('span', { className: 'response-spotlight-date' }, responseDate)
        )
      ),
      container
    );
  }

  function RSVPForm({ refreshResponses }){
    const [name, setName] = useState('');
    const [numberOfGuests, setNumberOfGuests] = useState(1);
    const [guestNames, setGuestNames] = useState(['']);
    const [status, setStatus] = useState('yes');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedData, setSubmittedData] = useState(null);
    const [error, setError] = useState('');

    function handleGuestCountChange(e) {
      const count = parseInt(e.target.value, 10) || 1;
      setNumberOfGuests(count);
      
      const newNames = [...guestNames];
      while (newNames.length < count) {
        newNames.push('');
      }
      while (newNames.length > count) {
        newNames.pop();
      }
      setGuestNames(newNames);
    }

    function handleGuestNameChange(index, value) {
      const newNames = [...guestNames];
      newNames[index] = value;
      setGuestNames(newNames);
    }

    async function onSubmit(e){
      e.preventDefault();
      setError('');

      if (!name.trim()){
        setError('Please enter your name.');
        return;
      }
      
      const additionalGuests = guestNames
        .slice(1)
        .map(n => (n || '').trim())
        .filter(Boolean);
      const allGuests = [name.trim(), ...additionalGuests];
      
      setSubmitting(true);
      try {
        const response = await fetch(RSVP_API_ROUTE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            status,
            message: message.trim(),
            guestCount: numberOfGuests,
            guestNames: additionalGuests
          })
        });

        if (!response.ok) {
          let errorMessage = 'There was an error. Please try again.';
          try {
            const payload = await response.json();
            if (payload && payload.error) {
              errorMessage = payload.error;
            }
          } catch (_) {
            // Ignore JSON parse errors from non-JSON responses
          }
          throw new Error(errorMessage);
        }
        
        setSubmittedData({
          name: name.trim(),
          guestCount: numberOfGuests,
          allGuests,
          status,
          message: message.trim()
        });
        setSubmitted(true);
        if (typeof refreshResponses === 'function') {
          refreshResponses();
        }
        
      } catch(err) {
        const messageText = err && err.message ? err.message : 'There was an error. Please try again.';
        setError(messageText);
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }

    function resetForm() {
      setSubmitted(false);
      setSubmittedData(null);
      setName('');
      setNumberOfGuests(1);
      setGuestNames(['']);
      setStatus('yes');
      setMessage('');
    }

    if (submitted && submittedData) {
      const statusMessages = {
        'yes': 'We can\'t wait to celebrate with you!',
        'no': 'We\'ll miss you, but we appreciate you letting us know.',
        'maybe': 'We hope to see you there! Let us know when you\'ve decided.'
      };
      
      const guestText = submittedData.guestCount === 1 
        ? '' 
        : submittedData.guestCount === 2 
          ? ' and your guest' 
          : ' and your ' + (submittedData.guestCount - 1) + ' guests';
      
      return React.createElement('div', { className: 'rsvp-success card' },
        React.createElement('div', { className: 'success-icon' },
          React.createElement('svg', { 
            width: 48, height: 48, viewBox: '0 0 24 24', 
            fill: 'none', stroke: 'currentColor', strokeWidth: 2 
          },
            React.createElement('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' })
          )
        ),
        React.createElement('h3', { className: 'success-title' }, 
          submittedData.status === 'yes' ? 'See You There!' : 
          submittedData.status === 'no' ? 'Thank You!' : 'Got It!'
        ),
        React.createElement('p', { className: 'success-greeting' }, 
          'Dear ' + submittedData.name.split(' ')[0] + guestText + ','
        ),
        React.createElement('p', { className: 'success-message' }, 
          statusMessages[submittedData.status]
        ),
        
        submittedData.message && React.createElement('div', { className: 'success-user-message' },
          React.createElement('p', { className: 'user-message-label' }, 'Your message to us:'),
          React.createElement('p', { className: 'user-message-text' }, 
            '\u201C' + submittedData.message + '\u201D'
          )
        ),
        
        submittedData.guestCount > 1 && React.createElement('div', { className: 'success-guests' },
          React.createElement('p', { className: 'guests-label' }, 'Your party:'),
          React.createElement('p', { className: 'guests-names' }, 
            submittedData.allGuests.join(', ')
          )
        ),
        
        React.createElement('div', { className: 'success-signature' },
          React.createElement('p', { className: 'signature-text' }, 'With love,'),
          React.createElement('p', { className: 'signature-names' }, 'Josh & Joy')
        ),
        
        React.createElement('button', { 
          className: 'btn secondary', 
          onClick: resetForm,
          type: 'button'
        }, 'Submit Another Response')
      );
    }

    return React.createElement('div', { className: 'rsvp card' },
      React.createElement('form', { onSubmit },
        React.createElement('div', { className: 'full' },
          React.createElement('label', { htmlFor: 'rsvp-name' }, 'Your Name'),
          React.createElement('input', {
            id: 'rsvp-name',
            type: 'text', 
            placeholder: 'Enter your full name', 
            value: name,
            onChange: e => setName(e.target.value), 
            required: true
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'rsvp-guests' }, 'Number of Guests'),
          React.createElement('select', { 
            id: 'rsvp-guests',
            value: numberOfGuests, 
            onChange: handleGuestCountChange
          },
            React.createElement('option', { value: 1 }, 'Just me'),
            React.createElement('option', { value: 2 }, '2 guests'),
            React.createElement('option', { value: 3 }, '3 guests'),
            React.createElement('option', { value: 4 }, '4 guests'),
            React.createElement('option', { value: 5 }, '5 guests'),
            React.createElement('option', { value: 6 }, '6 guests'),
            React.createElement('option', { value: 7 }, '7 guests'),
            React.createElement('option', { value: 8 }, '8+ guests')
          )
        ),
        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'rsvp-status' }, 'Will you attend?'),
          React.createElement('select', { 
            id: 'rsvp-status',
            value: status, 
            onChange: e => setStatus(e.target.value) 
          },
            React.createElement('option', { value: 'yes' }, 'Yes, we\'ll be there!'),
            React.createElement('option', { value: 'no' }, 'Sorry, can\'t make it'),
            React.createElement('option', { value: 'maybe' }, 'Still deciding')
          )
        ),
        numberOfGuests > 1 && React.createElement('div', { className: 'full guest-names-section' },
          React.createElement('label', null, 'Names of Other Guests'),
          React.createElement('p', { className: 'field-hint' }, 
            'Please list the names of everyone in your party'
          ),
          React.createElement('div', { className: 'guest-names-list' },
            guestNames.slice(1).map((guestName, index) => 
              React.createElement('input', {
                key: index + 1,
                type: 'text',
                placeholder: 'Guest ' + (index + 2) + ' name',
                value: guestName,
                onChange: e => handleGuestNameChange(index + 1, e.target.value),
                className: 'guest-name-input'
              })
            )
          )
        ),
        React.createElement('div', { className: 'full' },
          React.createElement('label', { htmlFor: 'rsvp-message' }, 'Message for the Couple (Optional)'),
          React.createElement('p', { className: 'field-hint message-hint' }, 'A short blessing, prayer, or memory (max ' + MESSAGE_MAX_LENGTH + ' characters)'),
          React.createElement('textarea', {
            id: 'rsvp-message',
            placeholder: 'Share your wishes for Josh & Joy...', 
            value: message,
            maxLength: MESSAGE_MAX_LENGTH,
            onChange: e => setMessage(e.target.value)
          })
        ),
        React.createElement('div', { className: 'full actions' },
          React.createElement('button', { 
            className: 'btn primary', 
            type: 'submit', 
            disabled: submitting 
          }, submitting ? 'Sending...' : 'Send RSVP'),
          error && React.createElement('span', { className: 'error-message' }, error)
        )
      )
    );
  }

  function RSVPApp(){
    const { responses, loadingResponses, responsesError, fetchResponses } = useResponsesFeed();

    return React.createElement(React.Fragment, null,
      React.createElement(ResponseSpotlight, { 
        responses, 
        loadingResponses, 
        responsesError 
      }),
      React.createElement(RSVPForm, { refreshResponses: fetchResponses })
    );
  }

  function mount(){
    const rv = document.getElementById('rsvpReact');
    if (rv){ 
      ReactDOM.createRoot(rv).render(React.createElement(RSVPApp)); 
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
