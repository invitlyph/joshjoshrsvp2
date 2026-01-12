// ============================================
// React Music Player Component
// ============================================

;(function(){
  const { useEffect, useRef, useState } = React;

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
      src: 'songs/Bless The Broken Road  Rascal Flatts (Boyce Avenue acoustic cover).mp3',
    },
    {
      title: 'Tenerife Sea',
      src: 'songs/Ed Sheeran - Tenerife Sea.mp3'
    },
    { 
      title: 'Jesus & You', 
      src: 'songs/Matthew West - Jesus & You.mp3' 
    },
    { 
      title: 'PALAGI', 
      src: 'songs/PALAGI - TJxKZ  LIVE SESSIONS.mp3' 
    },
    { 
      title: 'When I Say I Do', 
      src: 'songs/When I Say I Do.mp3' 
    },
  ];

  function Icon({ name }) {
    const commonProps = {
      width: 18,
      height: 18,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    };

    let elements = [];

    switch (name) {
      case 'prev':
        elements = [
          React.createElement('polyline', { key: 'a', points: '19 20 9 12 19 4' }),
          React.createElement('line', { key: 'b', x1: 9, y1: 19, x2: 9, y2: 5 })
        ];
        break;
      case 'next':
        elements = [
          React.createElement('polyline', { key: 'a', points: '5 4 15 12 5 20' }),
          React.createElement('line', { key: 'b', x1: 15, y1: 5, x2: 15, y2: 19 })
        ];
        break;
      case 'play':
        elements = [
          React.createElement('polygon', { key: 'a', points: '6 4 20 12 6 20' })
        ];
        break;
      case 'pause':
        elements = [
          React.createElement('rect', { key: 'a', x: 6, y: 4, width: 4, height: 16 }),
          React.createElement('rect', { key: 'b', x: 14, y: 4, width: 4, height: 16 })
        ];
        break;
      case 'volume-on':
        elements = [
          React.createElement('polygon', { key: 'a', points: '11 5 6 9 2 9 2 15 6 15 11 19' }),
          React.createElement('path', { key: 'b', d: 'M15 9a4 4 0 0 1 0 6' }),
          React.createElement('path', { key: 'c', d: 'M19 7a8 8 0 0 1 0 10' })
        ];
        break;
      case 'volume-off':
        elements = [
          React.createElement('polygon', { key: 'a', points: '11 5 6 9 2 9 2 15 6 15 11 19' }),
          React.createElement('line', { key: 'b', x1: 23, y1: 9, x2: 17, y2: 15 }),
          React.createElement('line', { key: 'c', x1: 17, y1: 9, x2: 23, y2: 15 })
        ];
        break;
      default:
        elements = [];
    }

    return React.createElement('svg', commonProps, elements);
  }

  function FloatingMusicPlayer(){
    // Start on a random track
    const [index, setIndex] = useState(() => Math.floor(Math.random() * PLAYLIST.length));
    const [playing, setPlaying] = useState(false);
    const [cur, setCur] = useState(0);
    const [dur, setDur] = useState(0);
    // Default volume to 30%
    const [vol, setVol] = useState(0.3);
    const [durMap, setDurMap] = useState({});
    const [isMuted, setIsMuted] = useState(true); // start muted to satisfy autoplay policies
    const [hasInteracted, setHasInteracted] = useState(false);
    const audioRef = useRef(null);

    const track = PLAYLIST[index];

    // Update widget state
    useEffect(() => {
      if (window.updateMusicWidgetState) {
        window.updateMusicWidgetState(playing);
      }
      if (window.updateMusicWidgetTitle) {
        window.updateMusicWidgetTitle(playing ? track.title : 'Music Paused');
      }
    }, [playing, track]);

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      a.volume = vol;
    }, [vol]);

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      a.muted = isMuted;
    }, [isMuted]);

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

    // Autoplay on first user interaction
    useEffect(() => {
      const handleFirstInteraction = () => {
        if (!hasInteracted) {
          setHasInteracted(true);
          setPlaying(true);
          // Unmute on first user gesture
          const a = audioRef.current;
          if (a) {
            a.muted = false;
            setIsMuted(false);
            a.play().catch(()=>{});
          }
        }
      }; 

      // Try to autoplay immediately
      const a = audioRef.current;
      if (a) {
        // ensure muted for autoplay
        a.muted = true;
        setIsMuted(true);
        a.play().then(() => {
          // playing silently until user unmutes
          setPlaying(true);
        }).catch(() => {
          // Autoplay blocked, wait for user interaction (cover more events)
          document.addEventListener('click', handleFirstInteraction, { once: true });
          document.addEventListener('touchstart', handleFirstInteraction, { once: true });
          document.addEventListener('pointerdown', handleFirstInteraction, { once: true });
          document.addEventListener('keydown', handleFirstInteraction, { once: true });
        });
      }

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('pointerdown', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };
    }, []);

    // Show a subtle "Tap to listen" hint on the collapsed circle
    useEffect(() => {
      const widget = document.getElementById('musicWidget');
      if (!widget) return;
      if (isMuted && !hasInteracted) {
        widget.classList.add('tap-hint');
      } else {
        widget.classList.remove('tap-hint');
      }
    }, [isMuted, hasInteracted]);

    // Preload metadata for all tracks to populate durations in playlist
    useEffect(() => {
      const audios = [];
      PLAYLIST.forEach((t, i) => {
        // skip if already have duration
        if (durMap[i] && durMap[i] > 0) return;
        const a = new Audio();
        a.preload = 'metadata';
        a.src = t.src;
        const onMeta = () => {
          if (isFinite(a.duration)) {
            setDurMap(m => ({ ...m, [i]: a.duration }));
          }
        };
        a.addEventListener('loadedmetadata', onMeta, { once: true });
        audios.push(a);
      });
      return () => {
        audios.forEach(a => {
          a.removeAttribute('src');
        });
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
      // Pick a random next track different from current
      setIndex(i => {
        if (PLAYLIST.length < 2) return i;
        let j = i;
        while (j === i) {
          j = Math.floor(Math.random() * PLAYLIST.length);
        }
        return j;
      });
      setPlaying(true); 
    }
    
    function prev(){ 
      // Also randomize previous for simplicity
      setIndex(i => {
        if (PLAYLIST.length < 2) return i;
        let j = i;
        while (j === i) {
          j = Math.floor(Math.random() * PLAYLIST.length);
        }
        return j;
      });
      setPlaying(true); 
    }

    function choose(i){ 
      setIndex(i); 
      setPlaying(true); 
    }

    function toggleMute(){
      const a = audioRef.current;
      if (!a) return;
      setHasInteracted(true);
      setIsMuted(m => !m);
    }

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
          autoPlay: true,
          playsInline: true,
          preload: 'auto',
          muted: isMuted,
          onTimeUpdate: onTime,
          onLoadedMetadata: onMeta,
          onEnded: onEnded,
          style: { display: 'none' }
        }),
        React.createElement('div', { className: 'now' },
          React.createElement('div', { className: 'title' }, track.title),
          React.createElement('div', { className: 'time' }, `${fmtTime(cur)} / ${fmtTime(dur)}`)
        ),
        React.createElement('div', { className: 'row' },
          React.createElement('input', {
            className: 'progress', type: 'range', min: 0,
            max: dur || 0, step: 0.1, value: Math.min(cur, dur||0), onChange: seek,
            'aria-label': 'Seek'
          })
        ),
        React.createElement('div', { className: 'controls' },
          React.createElement('button', { className: 'btn ghost', onClick: prev, 'aria-label': 'Previous' }, React.createElement(Icon, { name: 'prev' })),
          React.createElement('button', { className: 'btn', onClick: toggle, 'aria-label': playing ? 'Pause' : 'Play' }, React.createElement(Icon, { name: playing ? 'pause' : 'play' })),
          React.createElement('button', { className: 'btn ghost', onClick: next, 'aria-label': 'Next' }, React.createElement(Icon, { name: 'next' })),
          React.createElement('div', { style: { flex: 1 } }),
          React.createElement('button', {
            className: 'btn ghost',
            onClick: toggleMute,
            'aria-label': isMuted ? 'Unmute audio' : 'Mute audio'
          }, React.createElement(Icon, { name: isMuted ? 'volume-off' : 'volume-on' })),
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
              React.createElement('div', { className: 'dur' }, durMap[i] > 0 ? fmtTime(durMap[i]) : '\u2014')
            )
          ))
        )
      )
    );
  }

  function mount(){
    const fp = document.getElementById('floatingMusicPlayer');
    if (fp){ 
      ReactDOM.createRoot(fp).render(React.createElement(FloatingMusicPlayer)); 
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
