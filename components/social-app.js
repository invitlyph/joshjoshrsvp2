// ============================================
// Wedding Social App
// Guests can sign in, post, comment, and react
// using the Supabase backend configured for the
// Josh & Joy wedding invitation experience.
// ============================================

;(function () {
  const { useState, useEffect, useMemo, useCallback, useRef } = React;
  const { createPortal } = ReactDOM;

  const STORAGE_BUCKET = 'wedding-media';
  const LOCAL_STORAGE_KEYS = {
    guest: 'weddingSocialGuest',
    storiesViewed: 'weddingSocialStoriesViewed'
  };
  const STORY_DURATION_MS = 5000;
  const REACTION_OPTIONS = [
    { type: 'love', label: 'Love', emoji: '\u2764\uFE0F' },
    { type: 'celebrate', label: 'Celebrate', emoji: '\uD83E\uDD42' },
    { type: 'laugh', label: 'Joyful', emoji: '\uD83D\uDE0A' },
    { type: 'wow', label: 'Wow', emoji: '\uD83E\uDD29' },
    { type: 'pray', label: 'Prayers', emoji: '\uD83D\uDE4F' }
  ];
  const POSTS_PAGE_SIZE = 10;

  function getPersistedGuest() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.guest);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Unable to read saved guest', err);
      return null;
    }
  }

  function persistGuest(guest) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.guest, JSON.stringify(guest));
    } catch (err) {
      console.warn('Unable to store guest locally', err);
    }
  }

  function clearPersistedGuest() {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.guest);
    } catch (err) {
      console.warn('Unable to clear guest cache', err);
    }
  }

  function loadViewedStories() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.storiesViewed);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn('Unable to load viewed stories cache', err);
      return {};
    }
  }

  function persistViewedStories(map) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.storiesViewed, JSON.stringify(map));
    } catch (err) {
      console.warn('Unable to store viewed story info', err);
    }
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return '';
    const value = new Date(dateString);
    const now = new Date();
    const seconds = (value.getTime() - now.getTime()) / 1000;
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const absSeconds = Math.abs(seconds);
    if (absSeconds < 60) return formatter.format(Math.round(seconds), 'second');
    if (absSeconds < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
    if (absSeconds < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
    if (absSeconds < 604800) return formatter.format(Math.round(seconds / 86400), 'day');
    return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function initialsAvatar(name) {
    const seed = encodeURIComponent(name || 'Guest');
    return 'https://api.dicebear.com/7.x/initials/svg?radius=50&fontSize=40&seed=' + seed + '&backgroundColor=7B9AAB';
  }

  function mediaTypeFromFile(file) {
    if (!file || !file.type) return 'image';
    return file.type.startsWith('video') ? 'video' : 'image';
  }

  function useSupabaseClient() {
    return useMemo(() => {
      if (
        !window ||
        !window.supabase ||
        !window.SUPABASE_URL ||
        !window.SUPABASE_ANON_KEY
      ) {
        console.warn('Supabase config missing');
        return null;
      }

      if (!window.__weddingSocialSupabase) {
        window.__weddingSocialSupabase = window.supabase.createClient(
          window.SUPABASE_URL,
          window.SUPABASE_ANON_KEY,
          {
            auth: { persistSession: false }
          }
        );
      }

      return window.__weddingSocialSupabase;
    }, []);
  }

  async function uploadToStorage(supabaseClient, file, folder, guestId) {
    if (!file) throw new Error('File is required');
    const safeName = (file.name || 'media')
      .split('.')
      .pop()
      .toLowerCase();
    const path =
      folder +
      '/' +
      (guestId || 'guest') +
      '/' +
      Date.now() +
      '-' +
      Math.random().toString(36).slice(2) +
      '.' +
      safeName;

    const { data, error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined
      });

    if (error) throw error;
    const publicUrl = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
    return publicUrl?.data?.publicUrl || '';
  }

  function Icon({ name }) {
    const baseProps = {
      width: 24,
      height: 24,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    };

    switch (name) {
      case 'plus':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', { d: 'M12 5v14M5 12h14' })
        );
      case 'camera':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', { d: 'M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z' }),
          React.createElement('circle', { cx: 12, cy: 13, r: 3 })
        );
      case 'sparkles':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', { d: 'M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3z' }),
          React.createElement('path', { d: 'M5 19l.8 2 .8-2 2-.8-2-.8-.8-2-.8 2-2 .8zM17 17l1.2 3 1.2-3 3-1.2-3-1.2-1.2-3-1.2 3-3 1.2z' })
        );
      case 'comment':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', { d: 'M20 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z' })
        );
      case 'send':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', { d: 'M22 2L11 13' }),
          React.createElement('path', { d: 'M22 2l-7 20-4-9-9-4z' })
        );
      case 'heart':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', {
            d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z'
          })
        );
      case 'dots':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('circle', { cx: 5, cy: 12, r: 1.5 }),
          React.createElement('circle', { cx: 12, cy: 12, r: 1.5 }),
          React.createElement('circle', { cx: 19, cy: 12, r: 1.5 })
        );
      case 'back':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', { d: 'M15 18l-6-6 6-6' })
        );
      case 'forward':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', { d: 'M9 18l6-6-6-6' })
        );
      case 'upload':
        return React.createElement(
          'svg',
          { ...baseProps, viewBox: '0 0 24 24' },
          React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
          React.createElement('path', { d: 'M7 10l5-5 5 5' }),
          React.createElement('path', { d: 'M12 5v12' })
        );
      default:
        return null;
    }
  }

  function AuthScreen({ onSubmit, loading, error }) {
    const [form, setForm] = useState({
      name: '',
      email: '',
      avatarFile: null,
      avatarPreview: ''
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
      return () => {
        if (form.avatarPreview) {
          URL.revokeObjectURL(form.avatarPreview);
        }
      };
    }, [form.avatarPreview]);

    const handleChange = (field) => (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleAvatarFileChange = (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (form.avatarPreview) {
        URL.revokeObjectURL(form.avatarPreview);
      }
      const preview = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        avatarFile: file,
        avatarPreview: preview
      }));
    };

    const handleAvatarFileRemove = () => {
      if (form.avatarPreview) {
        URL.revokeObjectURL(form.avatarPreview);
      }
      setForm((prev) => ({
        ...prev,
        avatarFile: null,
        avatarPreview: ''
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleSubmit = (event) => {
      event.preventDefault();
      onSubmit(form);
    };

    return React.createElement(
      'div',
      { className: 'auth-screen' },
      React.createElement(
        'div',
        { className: 'auth-card' },
        React.createElement(
          'div',
          { className: 'auth-logo' },
          React.createElement('div', { className: 'auth-logo-icon' }, React.createElement(Icon, { name: 'camera' })),
          React.createElement('div', { className: 'auth-logo-text' }, 'Wedding Moments')
        ),
        React.createElement(
          'p',
          { className: 'auth-subtitle' },
          'Create a guest profile to share photos, videos, and stories from the celebration.'
        ),
        React.createElement(
          'form',
          { className: 'auth-form', onSubmit: handleSubmit },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Full name*',
            required: true,
            value: form.name,
            onChange: handleChange('name')
          }),
          React.createElement('input', {
            type: 'email',
            placeholder: 'Email address*',
            required: true,
            value: form.email,
            onChange: handleChange('email')
          }),
          React.createElement(
            'div',
            { className: 'auth-avatar-upload' },
            form.avatarPreview &&
              React.createElement('img', {
                className: 'auth-avatar-preview',
                src: form.avatarPreview,
                alt: 'Profile preview'
              }),
            !form.avatarPreview &&
              React.createElement(
                'div',
                { className: 'auth-avatar-placeholder' },
                'Add a profile photo (optional)'
              ),
            React.createElement(
              'div',
              { className: 'auth-avatar-actions' },
              React.createElement(
                'button',
                {
                  type: 'button',
                  className: 'secondary',
                  onClick: function () {
                    if (fileInputRef.current) fileInputRef.current.click();
                  }
                },
                'Upload Photo'
              ),
              form.avatarFile &&
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    className: 'text',
                    onClick: handleAvatarFileRemove
                  },
                  'Remove'
                )
            ),
            React.createElement('input', {
              ref: fileInputRef,
              type: 'file',
              accept: 'image/*',
              style: { display: 'none' },
              onChange: handleAvatarFileChange
            })
          ),
          React.createElement(
            'button',
            { className: 'primary', type: 'submit', disabled: loading },
            loading ? 'Saving...' : 'Enter Wedding Moments'
          ),
          error && React.createElement('p', { className: 'error-message', role: 'alert' }, error)
        ),
        React.createElement(
          'p',
          { className: 'auth-footer' },
          'Photos and videos are visible to everyone invited to Josh & Joy\'s celebration.'
        )
      )
    );
  }

  function SocialHeader({ guest, onOpenComposer, onSignOut }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      if (!menuOpen) return;
      const handleClick = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [menuOpen]);

    const avatar = guest?.avatar_url || initialsAvatar(guest?.name);

    return React.createElement(
      'header',
      { className: 'social-header' },
      React.createElement(
        'div',
        { className: 'social-header-inner' },
        React.createElement(
          'a',
          { className: 'social-logo', href: 'index.html' },
          React.createElement('div', { className: 'social-logo-icon' }, React.createElement(Icon, { name: 'camera' })),
          React.createElement('span', { className: 'social-logo-text' }, 'Josh & Joy Moments')
        ),
        React.createElement(
          'div',
          { className: 'social-header-actions' },
          React.createElement(
            'button',
            {
              className: 'header-btn',
              title: 'Share a post',
              onClick: function () {
                onOpenComposer('post');
              }
            },
            React.createElement(Icon, { name: 'camera' })
          ),
          React.createElement(
            'button',
            {
              className: 'header-btn',
              title: 'Add to story',
              onClick: function () {
                onOpenComposer('story');
              }
            },
            React.createElement(Icon, { name: 'sparkles' })
          ),
          React.createElement(
            'div',
            { className: 'user-menu', ref: menuRef },
            React.createElement(
              'button',
              {
                className: 'user-menu-trigger',
                onClick: function () {
                  setMenuOpen(function (prev) {
                    return !prev;
                  });
                }
              },
              React.createElement('img', { src: avatar, alt: guest?.name || 'Guest avatar' })
            ),
            menuOpen &&
              React.createElement(
                'div',
                { className: 'user-menu-dropdown' },
                React.createElement(
                  'div',
                  { className: 'user-menu-header' },
                  React.createElement('div', { className: 'user-menu-name' }, guest?.name || 'Guest'),
                  guest?.email && React.createElement('div', { className: 'user-menu-email' }, guest.email)
                ),
                React.createElement(
                  'button',
                  {
                    className: 'user-menu-item',
                    onClick: function () {
                      setMenuOpen(false);
                      onOpenComposer('post');
                    }
                  },
                  React.createElement(Icon, { name: 'camera' }),
                  'Share Post'
                ),
                React.createElement(
                  'button',
                  {
                    className: 'user-menu-item',
                    onClick: function () {
                      setMenuOpen(false);
                      onOpenComposer('story');
                    }
                  },
                  React.createElement(Icon, { name: 'sparkles' }),
                  'Add Story'
                ),
                React.createElement(
                  'button',
                  {
                    className: 'user-menu-item danger',
                    onClick: function () {
                      setMenuOpen(false);
                      onSignOut();
                    }
                  },
                  React.createElement(Icon, { name: 'back' }),
                  'Switch Guest'
                )
              )
          )
        )
      )
    );
  }

  function StoriesBar({ groups, onSelectStory, onAddStory, viewedStories }) {
    return React.createElement(
      'div',
      { className: 'stories-bar' },
      React.createElement(
        'div',
        { className: 'stories-scroll' },
        React.createElement(
          'div',
          {
            className: 'story-item',
            onClick: onAddStory,
            role: 'button',
            tabIndex: 0
          },
          React.createElement(
            'div',
            { className: 'story-ring add-story' },
            React.createElement(
              'div',
              { className: 'story-add-icon' },
              React.createElement(Icon, { name: 'plus' })
            )
          ),
          React.createElement('span', { className: 'story-name' }, 'Add Story')
        ),
        groups.length === 0 &&
          React.createElement(
            'div',
            { className: 'story-item' },
            React.createElement(
              'div',
              { className: 'story-ring add-story' },
              React.createElement(
                'div',
                { className: 'story-add-icon' },
                React.createElement(Icon, { name: 'camera' })
              )
            ),
            React.createElement('span', { className: 'story-name' }, 'Be the first to share')
          ),
        groups.map(function (group, index) {
          const guest = group.guest || {};
          const isViewed = group.stories.every(function (story) {
            return Boolean(viewedStories[story.id]);
          });
          return React.createElement(
            'div',
            {
              key: guest.id || index,
              className: 'story-item',
              onClick: function () {
                onSelectStory(index, 0);
              }
            },
            React.createElement(
              'div',
              { className: 'story-ring' + (isViewed ? ' viewed' : '') },
              React.createElement('img', {
                className: 'story-avatar',
                src: guest.avatar_url || initialsAvatar(guest.name),
                alt: guest.name || 'Guest story'
              })
            ),
            React.createElement('span', { className: 'story-name' }, guest.name || 'Guest')
          );
        })
      )
    );
  }

  function ReactionPicker({ onSelect }) {
    return React.createElement(
      'div',
      { className: 'reaction-picker' },
      REACTION_OPTIONS.map(function (option) {
        return React.createElement(
          'button',
          {
            key: option.type,
            type: 'button',
            className: 'reaction-option',
            onClick: function () {
              onSelect(option.type);
            }
          },
          option.emoji
        );
      })
    );
  }

  function CommentList({ comments }) {
    if (!comments || comments.length === 0) return null;
    return React.createElement(
      'div',
      { className: 'comments-section' },
      comments.map(function (comment) {
        const guest = comment.guest || {};
        return React.createElement(
          'div',
          { className: 'comment-item', key: comment.id },
          React.createElement('img', {
            className: 'comment-avatar',
            src: guest.avatar_url || initialsAvatar(guest.name),
            alt: guest.name || 'Guest avatar'
          }),
          React.createElement(
            'div',
            { className: 'comment-content' },
            React.createElement(
              'div',
              null,
              React.createElement('span', { className: 'comment-author' }, guest.name || 'Guest'),
              React.createElement('span', { className: 'comment-text' }, comment.content)
            ),
            React.createElement('div', { className: 'comment-meta' }, formatRelativeTime(comment.created_at))
          )
        );
      })
    );
  }

  function PostCard({ post, viewerId, onReact, onComment }) {
    const [showComments, setShowComments] = useState(false);
    const [commentValue, setCommentValue] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
      if (!showPicker) return;
      const handleClick = (event) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
          setShowPicker(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [showPicker]);

    const guest = post.guest || {};
    const viewerReaction =
      post.reactions?.find(function (reaction) {
        return reaction.guest_id === viewerId;
      }) || null;

    const reactionSummary = useMemo(() => {
      const counts = {};
      (post.reactions || []).forEach(function (reaction) {
        counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
      });
      return counts;
    }, [post.reactions]);

    const commentsPreview = (post.comments || []).slice(-2);

    const handleSubmitComment = (event) => {
      event.preventDefault();
      if (!commentValue.trim()) return;
      onComment(post.id, commentValue.trim());
      setCommentValue('');
      setShowComments(true);
    };

    return React.createElement(
      'article',
      { className: 'post-card' },
      React.createElement(
        'header',
        { className: 'post-header' },
        React.createElement(
          'div',
          { className: 'post-author' },
          React.createElement('img', {
            className: 'post-author-avatar',
            src: guest.avatar_url || initialsAvatar(guest.name),
            alt: guest.name || 'Guest avatar'
          }),
          React.createElement(
            'div',
            { className: 'post-author-info' },
            React.createElement('span', { className: 'post-author-name' }, guest.name || 'Guest'),
            post.location && React.createElement('span', { className: 'post-location' }, post.location)
          )
        ),
        React.createElement('button', { className: 'post-more-btn', type: 'button' }, React.createElement(Icon, { name: 'dots' }))
      ),
      React.createElement(
        'div',
        { className: 'post-media' },
        post.media_type === 'video'
          ? React.createElement('video', {
              className: 'post-media-video',
              src: post.media_url,
              controls: true,
              playsInline: true
            })
          : React.createElement('img', {
              src: post.media_url,
              alt: post.caption || 'Wedding post',
              loading: 'lazy'
            })
      ),
      React.createElement(
        'div',
        { className: 'post-actions' },
        React.createElement(
          'div',
          { style: { position: 'relative' }, ref: pickerRef },
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'post-action-btn' + (viewerReaction ? ' liked' : ''),
              onClick: function () {
                setShowPicker(function (prev) {
                  return !prev;
                });
              }
            },
            React.createElement(Icon, { name: 'heart' })
          ),
          showPicker &&
            React.createElement(ReactionPicker, {
              onSelect: function (type) {
                setShowPicker(false);
                onReact(post.id, type);
              }
            })
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'post-action-btn',
            onClick: function () {
              setShowComments(function (prev) {
                return !prev;
              });
            }
          },
          React.createElement(Icon, { name: 'comment' })
        ),
        React.createElement('button', { type: 'button', className: 'post-action-btn' }, React.createElement(Icon, { name: 'send' }))
      ),
      React.createElement(
        'div',
        { className: 'post-stats' },
        React.createElement(
          'div',
          { className: 'post-likes' },
          Object.keys(reactionSummary).map(function (key) {
            const option = REACTION_OPTIONS.find(function (item) {
              return item.type === key;
            });
            if (!option) return null;
            return React.createElement(
              'span',
              { key: key },
              option.emoji,
              ' ',
              reactionSummary[key]
            );
          })
        ),
        post.comments && post.comments.length > 0
          ? React.createElement('div', { className: 'post-comments-count' }, post.comments.length, ' comments')
          : null
      ),
      post.caption &&
        React.createElement(
          'div',
          { className: 'post-caption' },
          React.createElement('span', { className: 'post-caption-author' }, guest.name || 'Guest'),
          ' ',
          post.caption
        ),
      post.comments && post.comments.length > 0
        ? React.createElement(
            'div',
            { className: 'post-comments-preview' },
            post.comments.length > 2 &&
              React.createElement(
                'button',
                {
                  className: 'view-comments-btn',
                  onClick: function () {
                    setShowComments(function (prev) {
                      return !prev;
                    });
                  }
                },
                showComments ? 'Hide comments' : 'View all ' + post.comments.length + ' comments'
              ),
            commentsPreview.map(function (comment) {
              const guestData = comment.guest || {};
              return React.createElement(
                'p',
                { key: comment.id },
                React.createElement('strong', null, guestData.name || 'Guest'),
                ' ',
                comment.content
              );
            })
          )
        : null,
      React.createElement('div', { className: 'post-timestamp' }, formatRelativeTime(post.created_at)),
      showComments &&
        React.createElement(
          React.Fragment,
          null,
          React.createElement(CommentList, { comments: post.comments || [] }),
          React.createElement(
            'form',
            { className: 'comments-section', onSubmit: handleSubmitComment },
            React.createElement('input', {
              type: 'text',
              className: 'comment-input',
              placeholder: 'Add a comment...',
              value: commentValue,
              onChange: function (event) {
                setCommentValue(event.target.value);
              }
            }),
            React.createElement(
              'button',
              {
                type: 'submit',
                className: 'comment-submit-btn',
                disabled: !commentValue.trim()
              },
              'Post'
            )
          )
        )
    );
  }

  function EmptyState({ onOpenComposer }) {
    return React.createElement(
      'div',
      { className: 'empty-state card' },
      React.createElement('div', { className: 'empty-icon' }, React.createElement(Icon, { name: 'camera' })),
      React.createElement('h3', { className: 'empty-title' }, 'Share the celebration'),
      React.createElement(
        'p',
        { className: 'empty-text' },
        'Be the very first guest to post a sneak peek from Josh & Joy\'s wedding!'
      ),
      React.createElement(
        'button',
        {
          className: 'primary',
          onClick: function () {
            onOpenComposer('post');
          }
        },
        'Upload a Memory'
      )
    );
  }

  function LoadingState() {
    return React.createElement(
      'div',
      { className: 'loading-state' },
      React.createElement('div', { className: 'loading-spinner' }),
      React.createElement('p', null, 'Loading moments...')
    );
  }

  function PostComposerModal({
    open,
    type,
    onTypeChange,
    state,
    onStateChange,
    onClose,
    onSubmit,
    loading,
    error
  }) {
    const fileInputRef = useRef(null);

    if (!open) return null;

    const handleFileChange = (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const preview = URL.createObjectURL(file);
      onStateChange({ ...state, file, previewUrl: preview });
    };

    const handleRemoveFile = () => {
      onStateChange({ ...state, file: null, previewUrl: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const body = React.createElement(
      'div',
      {
        className: 'modal-overlay',
        onClick: onClose
      },
      React.createElement(
        'div',
        {
          className: 'modal-content',
          onClick: function (event) {
            event.stopPropagation();
          }
        },
        React.createElement(
          'div',
          { className: 'modal-header' },
          React.createElement('h3', { className: 'modal-title' }, type === 'story' ? 'Add to Story' : 'Share a Post'),
          React.createElement(
            'button',
            { className: 'modal-close-btn', onClick: onClose, type: 'button' },
            '\u00D7'
          )
        ),
        React.createElement(
          'div',
          { className: 'modal-body' },
          React.createElement(
            'div',
            { className: 'post-type-tabs' },
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'post-type-tab' + (type === 'post' ? ' active' : ''),
                onClick: function () {
                  onTypeChange('post');
                }
              },
              React.createElement(Icon, { name: 'camera' }),
              'Post'
            ),
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'post-type-tab' + (type === 'story' ? ' active' : ''),
                onClick: function () {
                  onTypeChange('story');
                }
              },
              React.createElement(Icon, { name: 'sparkles' }),
              'Story'
            )
          ),
          React.createElement(
            'div',
            { className: 'upload-area' + (state.file ? ' has-file' : '') },
            state.previewUrl
              ? state.file &&
                (state.file.type.startsWith('video')
                  ? React.createElement('video', {
                      src: state.previewUrl,
                      controls: true,
                      style: { width: '100%', borderRadius: '12px' }
                    })
                  : React.createElement('img', {
                      src: state.previewUrl,
                      alt: 'Selected media',
                      style: { width: '100%', borderRadius: '12px' }
                    }))
              : React.createElement(
                  React.Fragment,
                  null,
                  React.createElement('div', { className: 'upload-icon' }, React.createElement(Icon, { name: 'upload' })),
                  React.createElement('p', { className: 'upload-text' }, 'Choose from gallery or open camera'),
                  React.createElement(
                    'p',
                    { className: 'upload-hint' },
                    'Tap the button below to pick a photo or video.'
                  )
                ),
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'primary full-width',
                onClick: function () {
                  if (fileInputRef.current) fileInputRef.current.click();
                },
                style: { marginTop: state.file ? '12px' : '20px' }
              },
              'Select Photo or Video'
            ),
            React.createElement('input', {
              type: 'file',
              accept: 'image/*,video/*',
              capture: 'environment',
              style: { display: 'none' },
              ref: fileInputRef,
              onChange: handleFileChange
            })
          ),
          state.file &&
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'secondary',
                onClick: handleRemoveFile,
                style: { marginBottom: '16px' }
              },
              'Remove media'
            ),
          type === 'post' &&
            React.createElement(
              React.Fragment,
              null,
              React.createElement('textarea', {
                placeholder: 'Write a caption...',
                value: state.caption,
                onChange: function (event) {
                  onStateChange({ ...state, caption: event.target.value });
                },
                rows: 3
              }),
              React.createElement('input', {
                type: 'text',
                placeholder: 'Location (optional)',
                value: state.location,
                onChange: function (event) {
                  onStateChange({ ...state, location: event.target.value });
                }
              })
            ),
          React.createElement(
            'button',
            {
              className: 'primary',
              onClick: onSubmit,
              disabled: loading || !state.file
            },
            loading ? 'Uploading...' : type === 'story' ? 'Share Story' : 'Share Post'
          ),
          error && React.createElement('p', { className: 'error-message', style: { marginTop: '12px' } }, error)
        )
      )
    );

    return createPortal(body, document.body);
  }

  function StoryViewer({
    open,
    storyGroups,
    groupIndex,
    storyIndex,
    onClose,
    onNext,
    onPrev,
    onReact,
    viewerId
  }) {
    if (!open) return null;
    const currentGroup = storyGroups[groupIndex];
    const currentStory = currentGroup && currentGroup.stories[storyIndex];
    if (!currentGroup || !currentStory) return null;

    const viewerReaction =
      currentStory.story_reactions?.find(function (reaction) {
        return reaction.guest_id === viewerId;
      }) || null;

    const body = React.createElement(
      'div',
      { className: 'story-viewer' },
      React.createElement(
        'div',
        { className: 'story-viewer-header' },
        React.createElement(
          'div',
          { className: 'story-progress-bar' },
          currentGroup.stories.map(function (story, idx) {
            let className = 'story-progress-fill';
            if (idx < storyIndex) className += ' complete';
            if (idx === storyIndex) className += ' active';
            return React.createElement(
              'div',
              { className: 'story-progress-segment', key: story.id },
              React.createElement('div', {
                className: className,
                style: { animationDuration: STORY_DURATION_MS / 1000 + 's' }
              })
            );
          })
        ),
        React.createElement(
          'div',
          { className: 'story-viewer-info' },
          React.createElement(
            'div',
            { className: 'story-viewer-author' },
            React.createElement('img', {
              className: 'story-viewer-avatar',
              src: currentGroup.guest?.avatar_url || initialsAvatar(currentGroup.guest?.name),
              alt: currentGroup.guest?.name || 'Guest'
            }),
            React.createElement(
              'div',
              null,
              React.createElement('div', { className: 'story-viewer-name' }, currentGroup.guest?.name || 'Guest'),
              React.createElement('div', { className: 'story-viewer-time' }, formatRelativeTime(currentStory.created_at))
            )
          ),
          React.createElement(
            'button',
            { className: 'story-viewer-close', onClick: onClose, type: 'button' },
            '\u00D7'
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'story-viewer-media' },
        currentStory.media_type === 'video'
          ? React.createElement('video', {
              src: currentStory.media_url,
              autoPlay: true,
              playsInline: true,
              controls: false,
              muted: true
            })
          : React.createElement('img', {
              src: currentStory.media_url,
              alt: 'Wedding story'
            })
      ),
      React.createElement(
        'button',
        {
          className: 'story-viewer-nav prev',
          onClick: onPrev,
          type: 'button'
        },
        React.createElement(Icon, { name: 'back' })
      ),
      React.createElement(
        'button',
        {
          className: 'story-viewer-nav next',
          onClick: onNext,
          type: 'button'
        },
        React.createElement(Icon, { name: 'forward' })
      ),
      React.createElement(
        'div',
        { className: 'story-viewer-reactions' },
        REACTION_OPTIONS.map(function (option) {
          return React.createElement(
            'button',
            {
              key: option.type,
              className:
                'story-reaction-btn' +
                (viewerReaction && viewerReaction.reaction_type === option.type ? ' active' : ''),
              onClick: function () {
                onReact(currentStory, option.type);
              },
              type: 'button'
            },
            option.emoji
          );
        })
      )
    );

    return createPortal(body, document.body);
  }

  function SocialApp() {
    const supabaseClient = useSupabaseClient();
    const [guest, setGuest] = useState(getPersistedGuest);
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);
    const [stories, setStories] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerType, setComposerType] = useState('post');
    const [composerState, setComposerState] = useState({
      file: null,
      previewUrl: '',
      caption: '',
      location: ''
    });
    const [composerError, setComposerError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [viewedStories, setViewedStories] = useState(loadViewedStories);
    const [storyViewer, setStoryViewer] = useState({
      open: false,
      groupIndex: 0,
      storyIndex: 0
    });
    const postsRequestRef = useRef(null);
    const storiesRequestRef = useRef(null);
    const postsCursorRef = useRef(null);

    const storyGroups = useMemo(() => {
      if (!stories || stories.length === 0) return [];
      const grouped = new Map();
      stories.forEach(function (story) {
        const guestId = story.guest?.id || 'guest';
        if (!grouped.has(guestId)) {
          grouped.set(guestId, { guest: story.guest, stories: [] });
        }
        grouped.get(guestId).stories.push(story);
      });
      const ordered = Array.from(grouped.values()).map(function (item) {
        return {
          guest: item.guest,
          stories: item.stories.sort(function (a, b) {
            return new Date(a.created_at) - new Date(b.created_at);
          })
        };
      });
      return ordered.sort(function (a, b) {
        const latestA = a.stories[a.stories.length - 1]?.created_at || 0;
        const latestB = b.stories[b.stories.length - 1]?.created_at || 0;
        return new Date(latestB) - new Date(latestA);
      });
    }, [stories]);

    const resetComposer = useCallback(() => {
      setComposerState({
        file: null,
        previewUrl: '',
        caption: '',
        location: ''
      });
      setComposerError('');
    }, []);

    const fetchPosts = useCallback(
      (options = {}) => {
        if (!supabaseClient || !guest) return Promise.resolve();
        if (postsRequestRef.current) {
          return postsRequestRef.current;
        }
        const reset = options.reset === true;
        if (reset) {
          postsCursorRef.current = null;
        } else if (!hasMorePosts) {
          return Promise.resolve();
        }

        const cursor = !reset ? postsCursorRef.current : null;

        const request = (async () => {
          let query = supabaseClient
            .from('posts')
            .select(
              `
              id,
              media_url,
              media_type,
              caption,
              location,
              created_at,
              guest:guest_id (
                id,
                name,
                avatar_url,
                email
              ),
              reactions:reactions (
                id,
                reaction_type,
                guest_id
              ),
              comments:comments (
                id,
                content,
                created_at,
                guest:guest_id (
                  id,
                  name,
                  avatar_url
                )
              )
            `
            )
            .order('created_at', { ascending: false })
            .limit(POSTS_PAGE_SIZE);

          if (cursor) {
            query = query.lt('created_at', cursor);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error loading posts', error);
            return;
          }

          const formatted = (data || []).map(function (post) {
            return {
              ...post,
              reactions: post.reactions || [],
              comments: (post.comments || []).sort(function (a, b) {
                return new Date(a.created_at) - new Date(b.created_at);
              })
            };
          });

          let snapshot = [];
          setPosts(function (prev) {
            if (reset) {
              const incomingIds = new Set(
                formatted.map(function (item) {
                  return item.id;
                })
              );
              const remainder = prev.filter(function (item) {
                return !incomingIds.has(item.id);
              });
              snapshot = formatted.concat(remainder);
            } else {
              const existingIds = new Set(
                prev.map(function (item) {
                  return item.id;
                })
              );
              const additions = formatted.filter(function (item) {
                return !existingIds.has(item.id);
              });
              snapshot = prev.concat(additions);
            }
            return snapshot;
          });

          if (snapshot.length > 0) {
            postsCursorRef.current =
              snapshot[snapshot.length - 1]?.created_at || null;
          }

          if (reset) {
            setHasMorePosts(formatted.length === POSTS_PAGE_SIZE);
          } else if (formatted.length < POSTS_PAGE_SIZE) {
            setHasMorePosts(false);
          }
        })();

        postsRequestRef.current = request;
        request.finally(function () {
          if (postsRequestRef.current === request) {
            postsRequestRef.current = null;
          }
        });

        return request;
      },
      [supabaseClient, guest, hasMorePosts]
    );

    const fetchStories = useCallback(() => {
      if (!supabaseClient || !guest) return Promise.resolve();
      if (storiesRequestRef.current) {
        return storiesRequestRef.current;
      }

      const request = (async () => {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabaseClient
          .from('stories')
          .select(
            `
            id,
            media_url,
            media_type,
            created_at,
            expires_at,
            guest:guest_id (
              id,
              name,
              avatar_url
            ),
            story_reactions:story_reactions (
              id,
              reaction_type,
              guest_id
            )
          `
          )
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false })
          .limit(60);

        if (error) {
          console.error('Unable to load stories', error);
          return;
        }

        setStories(
          (data || []).map(function (story) {
            return {
              ...story,
              story_reactions: story.story_reactions || []
            };
          })
        );
      })();

      storiesRequestRef.current = request;
      request.finally(function () {
        if (storiesRequestRef.current === request) {
          storiesRequestRef.current = null;
        }
      });

      return request;
    }, [supabaseClient, guest]);

    const loadInitialData = useCallback(async () => {
      if (!supabaseClient || !guest) return;
      setLoadingData(true);
      await Promise.all([fetchPosts({ reset: true }), fetchStories()]);
      setLoadingData(false);
    }, [supabaseClient, guest, fetchPosts, fetchStories]);

    useEffect(() => {
      if (guest && supabaseClient) {
        loadInitialData();
      }
    }, [guest, supabaseClient, loadInitialData]);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      const handleScroll = () => {
        if (loadingData || loadingMorePosts || !hasMorePosts) return;
        const doc = document.documentElement || document.body;
        const scrollPosition = window.scrollY + window.innerHeight;
        if (scrollPosition >= doc.scrollHeight - 400) {
          setLoadingMorePosts(true);
          Promise.resolve(fetchPosts())
            .catch(() => {})
            .finally(() => setLoadingMorePosts(false));
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }, [loadingData, loadingMorePosts, hasMorePosts, fetchPosts]);

    useEffect(() => {
      if (!supabaseClient || !guest) return;
      const channel = supabaseClient
        .channel('wedding-social-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'posts' },
          () => fetchPosts({ reset: true })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'comments' },
          () => fetchPosts({ reset: true })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reactions' },
          () => fetchPosts({ reset: true })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stories' },
          fetchStories
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'story_reactions' },
          fetchStories
        )
        .subscribe();

      return () => {
        supabaseClient.removeChannel(channel);
      };
    }, [supabaseClient, guest, fetchPosts, fetchStories]);

    const handleAuthSubmit = useCallback(
      async (values) => {
        if (!supabaseClient) return;
        const name = values.name?.trim();
        const email = values.email?.trim().toLowerCase();
        const avatarFile = values.avatarFile || null;

        if (!name || !email) {
          setAuthError('Name and email are required.');
          return;
        }

        setAuthLoading(true);
        setAuthError('');

        try {
          const { data: existing, error } = await supabaseClient
            .from('guests')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          let uploadedAvatarUrl = '';
          if (avatarFile) {
            try {
              uploadedAvatarUrl = await uploadToStorage(
                supabaseClient,
                avatarFile,
                'avatars',
                existing?.id || name
              );
            } catch (uploadError) {
              console.error('Avatar upload failed', uploadError);
              setAuthError('Profile photo upload failed. Please try again.');
              setAuthLoading(false);
              return;
            }
          }

          const payload = {
            name,
            email,
            avatar_url: uploadedAvatarUrl || existing?.avatar_url || initialsAvatar(name)
          };

          let record;
          if (existing) {
            const { data, error: updateError } = await supabaseClient
              .from('guests')
              .update(payload)
              .eq('id', existing.id)
              .select()
              .single();
            if (updateError) throw updateError;
            record = data;
          } else {
            const { data: inserted, error: insertError } = await supabaseClient
              .from('guests')
              .insert(payload)
              .select()
              .single();
            if (insertError) throw insertError;
            record = inserted;
          }

          persistGuest(record);
          setGuest(record);
        } catch (err) {
          console.error('Auth error', err);
          setAuthError('We could not save your profile. Please try again.');
        } finally {
          setAuthLoading(false);
        }
      },
      [supabaseClient]
    );

    const handleSignOut = useCallback(() => {
      clearPersistedGuest();
      setGuest(null);
      setPosts([]);
      setStories([]);
      setHasMorePosts(true);
      setLoadingMorePosts(false);
      postsCursorRef.current = null;
      postsRequestRef.current = null;
    }, []);

    const openComposer = useCallback((type) => {
      setComposerType(type);
      setComposerOpen(true);
      setComposerError('');
    }, []);

    const closeComposer = useCallback(() => {
      setComposerOpen(false);
      resetComposer();
    }, [resetComposer]);

    const handleUpload = useCallback(async () => {
      if (!supabaseClient || !guest) return;
      if (!composerState.file) {
        setComposerError('Please select a photo or video.');
        return;
      }

      setUploading(true);
      setComposerError('');

      try {
        const url = await uploadToStorage(
          supabaseClient,
          composerState.file,
          composerType === 'story' ? 'stories' : 'posts',
          guest.id
        );

        if (!url) {
          throw new Error('Missing URL');
        }

        if (composerType === 'story') {
          const { error } = await supabaseClient.from('stories').insert({
            guest_id: guest.id,
            media_url: url,
            media_type: mediaTypeFromFile(composerState.file)
          });
          if (error) throw error;
          await fetchStories();
        } else {
          const { error } = await supabaseClient.from('posts').insert({
            guest_id: guest.id,
            media_url: url,
            media_type: mediaTypeFromFile(composerState.file),
            caption: composerState.caption?.trim() || null,
            location: composerState.location?.trim() || null
          });
          if (error) throw error;
          await fetchPosts({ reset: true });
        }

        closeComposer();
      } catch (err) {
        console.error('Upload failed', err);
        setComposerError('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    }, [
      supabaseClient,
      guest,
      composerState,
      composerType,
      fetchPosts,
      fetchStories,
      closeComposer
    ]);

    const handleComment = useCallback(
      async (postId, content) => {
        if (!supabaseClient || !guest) return;
        const text = content.trim();
        if (!text) return;
        try {
          const { data, error } = await supabaseClient
            .from('comments')
            .insert({
              post_id: postId,
              guest_id: guest.id,
              content: text
            })
            .select(
              `
              id,
              content,
              created_at,
              guest:guest_id (
                id,
                name,
                avatar_url
              )
            `
            )
            .single();
          if (error) throw error;
          setPosts(function (prev) {
            return prev.map(function (post) {
              if (post.id !== postId) return post;
              return { ...post, comments: [...(post.comments || []), data] };
            });
          });
        } catch (err) {
          console.error('Failed to add comment', err);
        }
      },
      [supabaseClient, guest]
    );

    const handleReaction = useCallback(
      async (postId, reactionType) => {
        if (!supabaseClient || !guest) return;
        const post = posts.find(function (item) {
          return item.id === postId;
        });
        const existing = post?.reactions?.find(function (reaction) {
          return reaction.guest_id === guest.id;
        });

        try {
          if (existing && existing.reaction_type === reactionType) {
            await supabaseClient.from('reactions').delete().eq('id', existing.id);
            setPosts(function (prev) {
              return prev.map(function (item) {
                if (item.id !== postId) return item;
                return {
                  ...item,
                  reactions: item.reactions.filter(function (reaction) {
                    return reaction.id !== existing.id;
                  })
                };
              });
            });
            return;
          }

          if (existing) {
            await supabaseClient.from('reactions').delete().eq('id', existing.id);
          }

          const { data, error } = await supabaseClient
            .from('reactions')
            .insert({
              post_id: postId,
              guest_id: guest.id,
              reaction_type: reactionType
            })
            .select('id, reaction_type, guest_id')
            .single();
          if (error) throw error;

          setPosts(function (prev) {
            return prev.map(function (item) {
              if (item.id !== postId) return item;
              const filtered = existing
                ? item.reactions.filter(function (reaction) {
                    return reaction.id !== existing.id;
                  })
                : item.reactions;
              return { ...item, reactions: [...(filtered || []), data] };
            });
          });
        } catch (err) {
          console.error('Reaction failed', err);
        }
      },
      [supabaseClient, guest, posts]
    );

    const handleStoryReaction = useCallback(
      async (story, reactionType) => {
        if (!supabaseClient || !guest || !story) return;
        const existing = story.story_reactions?.find(function (reaction) {
          return reaction.guest_id === guest.id;
        });

        try {
          if (existing && existing.reaction_type === reactionType) {
            await supabaseClient.from('story_reactions').delete().eq('id', existing.id);
            setStories(function (prev) {
              return prev.map(function (item) {
                if (item.id !== story.id) return item;
                return {
                  ...item,
                  story_reactions: item.story_reactions.filter(function (reaction) {
                    return reaction.id !== existing.id;
                  })
                };
              });
            });
            return;
          }

          if (existing) {
            await supabaseClient.from('story_reactions').delete().eq('id', existing.id);
          }

          const { data, error } = await supabaseClient
            .from('story_reactions')
            .insert({
              story_id: story.id,
              guest_id: guest.id,
              reaction_type: reactionType
            })
            .select('id, reaction_type, guest_id')
            .single();
          if (error) throw error;

          setStories(function (prev) {
            return prev.map(function (item) {
              if (item.id !== story.id) return item;
              const filtered = existing
                ? item.story_reactions.filter(function (reaction) {
                    return reaction.id !== existing.id;
                  })
                : item.story_reactions;
              return { ...item, story_reactions: [...(filtered || []), data] };
            });
          });
        } catch (err) {
          console.error('Story reaction failed', err);
        }
      },
      [supabaseClient, guest]
    );

    const handleStoryViewed = useCallback(
      async (story) => {
        if (!story) return;
        setViewedStories(function (prev) {
          if (prev[story.id]) return prev;
          const next = { ...prev, [story.id]: Date.now() };
          persistViewedStories(next);
          return next;
        });
        if (!supabaseClient || !guest) return;
        try {
          await supabaseClient
            .from('story_views')
            .insert({ story_id: story.id, guest_id: guest.id });
        } catch (err) {
          if (!String(err?.message || '').includes('duplicate key value')) {
            console.error('Story view error', err);
          }
        }
      },
      [supabaseClient, guest]
    );

    const openStoryViewer = useCallback((groupIndex, storyIndex) => {
      setStoryViewer({
        open: true,
        groupIndex,
        storyIndex
      });
    }, []);

    const closeStoryViewer = useCallback(() => {
      setStoryViewer(function (prev) {
        return { ...prev, open: false };
      });
    }, []);

    const goToNextStory = useCallback(() => {
      setStoryViewer(function (prev) {
        const currentGroup = storyGroups[prev.groupIndex];
        if (!currentGroup) return { open: false, groupIndex: 0, storyIndex: 0 };
        if (prev.storyIndex < currentGroup.stories.length - 1) {
          return { ...prev, storyIndex: prev.storyIndex + 1 };
        }
        if (prev.groupIndex < storyGroups.length - 1) {
          return { open: true, groupIndex: prev.groupIndex + 1, storyIndex: 0 };
        }
        return { open: false, groupIndex: 0, storyIndex: 0 };
      });
    }, [storyGroups]);

    const goToPrevStory = useCallback(() => {
      setStoryViewer(function (prev) {
        if (prev.storyIndex > 0) {
          return { ...prev, storyIndex: prev.storyIndex - 1 };
        }
        if (prev.groupIndex > 0) {
          const previousGroup = storyGroups[prev.groupIndex - 1];
          const lastIndex = previousGroup ? previousGroup.stories.length - 1 : 0;
          return { open: true, groupIndex: prev.groupIndex - 1, storyIndex: lastIndex };
        }
        return prev;
      });
    }, [storyGroups]);

    useEffect(() => {
      if (!storyViewer.open) return;
      const currentGroup = storyGroups[storyViewer.groupIndex];
      const currentStory = currentGroup?.stories?.[storyViewer.storyIndex];
      if (currentStory) {
        handleStoryViewed(currentStory);
      }
    }, [storyViewer, storyGroups, handleStoryViewed]);

    useEffect(() => {
      if (!storyViewer.open) return;
      const timer = setTimeout(goToNextStory, STORY_DURATION_MS);
      return () => clearTimeout(timer);
    }, [storyViewer, goToNextStory]);

    if (!guest) {
      return React.createElement(AuthScreen, {
        onSubmit: handleAuthSubmit,
        loading: authLoading,
        error: authError
      });
    }

    return React.createElement(
      'div',
      { className: 'social-app' },
      React.createElement(SocialHeader, {
        guest: guest,
        onOpenComposer: openComposer,
        onSignOut: handleSignOut
      }),
      React.createElement(StoriesBar, {
        groups: storyGroups,
        onSelectStory: openStoryViewer,
        onAddStory: function () {
          openComposer('story');
        },
        viewedStories: viewedStories
      }),
      React.createElement(
        'main',
        { className: 'social-container' },
        loadingData
          ? React.createElement(LoadingState, null)
          : posts.length === 0
            ? React.createElement(EmptyState, { onOpenComposer: openComposer })
            : React.createElement(
                'section',
                { className: 'posts-feed' },
                posts.map(function (post) {
                  return React.createElement(PostCard, {
                    key: post.id,
                    post: post,
                    viewerId: guest.id,
                    onReact: handleReaction,
                    onComment: handleComment
                  });
                }),
                React.createElement(
                  'div',
                  { className: 'posts-feed-footer', 'aria-live': 'polite' },
                  loadingMorePosts
                    ? 'Loading more moments...'
                    : hasMorePosts
                      ? 'Scroll for more moments'
                      : "You're all caught up."
                )
              )
      ),
      React.createElement(
        'button',
        {
          className: 'fab',
          onClick: function () {
            openComposer('post');
          }
        },
        React.createElement(Icon, { name: 'plus' })
      ),
      React.createElement(PostComposerModal, {
        open: composerOpen,
        type: composerType,
        onTypeChange: setComposerType,
        state: composerState,
        onStateChange: setComposerState,
        onClose: closeComposer,
        onSubmit: handleUpload,
        loading: uploading,
        error: composerError
      }),
      React.createElement(StoryViewer, {
        open: storyViewer.open,
        storyGroups: storyGroups,
        groupIndex: storyViewer.groupIndex,
        storyIndex: storyViewer.storyIndex,
        onClose: closeStoryViewer,
        onNext: goToNextStory,
        onPrev: goToPrevStory,
        onReact: handleStoryReaction,
        viewerId: guest.id
      })
    );
  }

  const container = document.getElementById('socialApp');
  if (container) {
    ReactDOM.createRoot(container).render(React.createElement(SocialApp));
  }
})();
