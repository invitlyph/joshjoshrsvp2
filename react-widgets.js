;(function(){
  const { useEffect, useRef, useState, useCallback } = React;
  const RSVP_API_ROUTE = '/api/rsvp';

  // Utility: format seconds to mm:ss
  function fmtTime(sec){
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec/60);
    const s = Math.floor(sec%60);
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  // Playlist from local songs folder
  const PLAYLIST = [
    {
      title: 'Bless The Broken Road',
      artist: 'Boyce Avenue',
      src: 'songs/Bless The Broken Road  Rascal Flatts (Boyce Avenue acoustic cover).mp3',
    },
    {
      title: 'Tenerife Sea',
      artist: 'Ed Sheeran',
      src: 'songs/Ed Sheeran - Tenerife Sea.mp3'
    },
    { 
      title: 'Jesus & You', 
      artist: 'Matthew West',
      src: 'songs/Matthew West - Jesus & You.mp3' 
    },
    { 
      title: 'PALAGI', 
      artist: 'TJxKZ',
      src: 'songs/PALAGI - TJxKZ  LIVE SESSIONS.mp3' 
    },
    { 
      title: 'When I Say I Do', 
      artist: 'Unknown',
      src: 'songs/When I Say I Do.mp3' 
    },
  ];

  // Floating Music Player for Widget
  function FloatingMusicPlayer(){
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [cur, setCur] = useState(0);
    const [dur, setDur] = useState(0);
    const [vol, setVol] = useState(0.7);
    const [durMap, setDurMap] = useState({});
    const [hasInteracted, setHasInteracted] = useState(false);
    const audioRef = useRef(null);

    const track = PLAYLIST[index];

    // Update widget class based on playing state
    useEffect(() => {
      const widget = document.getElementById('musicWidget');
      if (widget) {
        widget.classList.toggle('paused', !playing);
      }
    }, [playing]);

    // Update "Now Playing" text
    useEffect(() => {
      const textEl = document.querySelector('.music-text');
      if (textEl && track) {
        textEl.textContent = playing ? `♪ ${track.title}` : 'Music Paused';
      }
    }, [playing, track]);

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      a.volume = vol;
    }, [vol]);

    // Load/Play on track change
    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      a.src = track.src;
      a.load();
      setCur(0);
      setDur(0);
      if (playing) {
        a.play().catch(()=>{});
      }
    }, [index]);

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      if (playing) {
        a.play().catch(()=>{});
      } else {
        a.pause();
      }
    }, [playing]);

    // Autoplay on page load (after user interaction)
    useEffect(() => {
      const handleFirstInteraction = () => {
        if (!hasInteracted) {
          setHasInteracted(true);
          setPlaying(true);
          // Expand widget when music starts
          const widget = document.getElementById('musicWidget');
          if (widget) {
            widget.classList.remove('collapsed');
          }
        }
      };

      // Try to autoplay immediately
      const a = audioRef.current;
      if (a) {
        a.play().then(() => {
          setPlaying(true);
          setHasInteracted(true);
          const widget = document.getElementById('musicWidget');
          if (widget) {
            widget.classList.remove('collapsed');
          }
        }).catch(() => {
          // Autoplay blocked, wait for user interaction
          document.addEventListener('click', handleFirstInteraction, { once: true });
          document.addEventListener('touchstart', handleFirstInteraction, { once: true });
          document.addEventListener('scroll', handleFirstInteraction, { once: true });
        });
      }

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('scroll', handleFirstInteraction);
      };
    }, []);

    function onTime(){
      const a = audioRef.current; if (!a) return;
      setCur(a.currentTime||0);
    }
    
    function onMeta(){
      const a = audioRef.current; if (!a) return;
      const d = a.duration || 0; setDur(d);
      setDurMap(m => ({...m, [index]: d}));
    }
    
    function onEnded(){ next(); }

    function toggle(){ 
      setPlaying(p => !p); 
      setHasInteracted(true);
    }
    
    function seek(e){
      const a = audioRef.current; if (!a) return;
      const v = Number(e.target.value);
      a.currentTime = v; setCur(v);
    }
    
    function changeVol(e){ setVol(Number(e.target.value)); }
    
    function next(){ 
      setIndex(i => (i+1) % PLAYLIST.length); 
      setPlaying(true); 
    }
    
    function prev(){ 
      setIndex(i => (i-1+PLAYLIST.length) % PLAYLIST.length); 
      setPlaying(true); 
    }

    function choose(i){ 
      setIndex(i); 
      setPlaying(true); 
    }

    // Prefetch duration for current
    useEffect(() => {
      const a = audioRef.current; if (!a) return;
      if (Number.isFinite(a.duration) && a.duration>0){
        setDurMap(m => ({...m, [index]: a.duration}));
      }
    }, [dur, index]);

    return (
      React.createElement('div', { className: 'player' },
        React.createElement('audio', {
          ref: audioRef,
          onTimeUpdate: onTime,
          onLoadedMetadata: onMeta,
          onEnded: onEnded,
          style: { display: 'none' }
        }),
        React.createElement('div', { className: 'now' },
          React.createElement('div', null,
            React.createElement('div', { className: 'title' }, track.title),
            React.createElement('div', { className: 'artist', style: { fontSize: '0.75rem', color: '#6B7C8A' } }, track.artist)
          ),
          React.createElement('div', { className: 'time' }, `${fmtTime(cur)} / ${fmtTime(dur)}`)
        ),
        React.createElement('div', { className: 'row', style: { marginBottom: 10 } },
          React.createElement('input', {
            className: 'progress', type: 'range', min: 0,
            max: dur || 0, step: 0.1, value: Math.min(cur, dur||0), onChange: seek,
            'aria-label': 'Seek'
          })
        ),
        React.createElement('div', { className: 'controls' },
          React.createElement('button', { className: 'btn ghost', onClick: prev, 'aria-label': 'Previous' }, '⏮'),
          React.createElement('button', { className: 'btn', onClick: toggle, 'aria-label': playing ? 'Pause' : 'Play' }, playing ? '⏸' : '▶'),
          React.createElement('button', { className: 'btn ghost', onClick: next, 'aria-label': 'Next' }, '⏭'),
          React.createElement('div', { style: { flex: 1 } }),
          React.createElement('input', {
            className: 'volume', type: 'range', min: 0, max: 1, step: 0.01, value: vol,
            onChange: changeVol, 'aria-label': 'Volume', title: 'Volume'
          })
        ),
        React.createElement('div', { className: 'playlist' },
          PLAYLIST.map((t, i) => (
            React.createElement('div', {
              key: i,
              className: 'track' + (i===index ? ' active' : ''),
              onClick: () => choose(i),
              role: 'button', tabIndex: 0,
              onKeyDown: (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); choose(i);} }
            },
              React.createElement('div', { className: 'name' }, t.title),
              React.createElement('div', { className: 'dur' }, fmtTime(durMap[i]))
            )
          ))
        )
      )
    );
  }

  // RSVP Form
  function RSVPForm(){
    const [name, setName] = useState('');
    const [status, setStatus] = useState('yes');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [note, setNote] = useState('');
    const [noteType, setNoteType] = useState(''); // 'success' or 'error'

    async function onSubmit(e){
      e.preventDefault();
      setNote('');
      setNoteType('');

      const trimmedName = (name || '').trim();
      if (!trimmedName){
        setNote('Please enter your name.');
        setNoteType('error');
        return;
      }

      setSubmitting(true);
      try{
        const response = await fetch(RSVP_API_ROUTE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            status,
            message: message.trim(),
            guestCount: 1,
            guestNames: []
          })
        });

        if (!response.ok){
          let apiError = 'There was an error saving your response. Please try again.';
          try {
            const payload = await response.json();
            if (payload && payload.error){
              apiError = payload.error;
            }
          } catch (_){ }
          throw new Error(apiError);
        }

        setNote('Thank you! Your message has been sent to Josh & Joy.');
        setNoteType('success');
        setName('');
        setMessage('');
        setStatus('yes');
      }catch(err){
        setNote((err && err.message) || 'There was an error saving your response. Please try again.');
        setNoteType('error');
        console.error(err);
      }finally{
        setSubmitting(false);
      }
    }

    return (
      React.createElement('div', { className: 'rsvp' },
        React.createElement('form', { onSubmit },
          React.createElement('div', { className: 'full' },
            React.createElement('label', { htmlFor: 'rsvp-name' }, 'Your Name'),
            React.createElement('input', {
              id: 'rsvp-name',
              type: 'text', 
              placeholder: 'Enter your full name', 
              value: name,
              onChange: e=>setName(e.target.value), 
              required: true
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'rsvp-status' }, 'Will you attend?'),
            React.createElement('select', { 
              id: 'rsvp-status',
              value: status, 
              onChange: e=>setStatus(e.target.value) 
            },
              React.createElement('option', { value: 'yes' }, '✓ Yes, I will attend'),
              React.createElement('option', { value: 'no' }, '✗ Sorry, cannot attend'),
              React.createElement('option', { value: 'maybe' }, '? Still deciding')
            )
          ),
          React.createElement('div', { className: 'full' },
            React.createElement('label', { htmlFor: 'rsvp-message' }, 'Leave a Message (optional)'),
            React.createElement('textarea', {
              id: 'rsvp-message',
              placeholder: 'Share your wishes for Josh & Joy...', 
              value: message,
              onChange: e=>setMessage(e.target.value)
            })
          ),
          React.createElement('div', { className: 'full actions' },
            React.createElement('button', { 
              className: 'btn primary', 
              type: 'submit', 
              disabled: submitting 
            }, submitting ? 'Sending...' : 'Send Message'),
            note && React.createElement('span', { 
              className: 'note',
              style: { 
                color: noteType === 'success' ? '#5A7A8A' : '#c0392b',
                fontWeight: noteType === 'success' ? '500' : '400'
              }
            }, note)
          )
        )
      )
    );
  }

  function mount(){
    // Mount floating music player
    const fp = document.getElementById('floatingMusicPlayer');
    if (fp){ 
      ReactDOM.createRoot(fp).render(React.createElement(FloatingMusicPlayer)); 
    }
    
    // Mount RSVP form
    const rv = document.getElementById('rsvpReact');
    if (rv){ 
      ReactDOM.createRoot(rv).render(React.createElement(RSVPForm)); 
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
