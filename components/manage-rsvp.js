// ============================================
// Josh & Joy RSVP Management Dashboard
// ============================================

;(function () {
  const { useState, useEffect, useMemo, useCallback } = React;
  const e = React.createElement;

  const RSVP_API_ROUTE = '/api/rsvp';
  const STATUS_LABELS = {
    yes: 'Attending',
    maybe: 'Pending',
    no: 'Regrets'
  };
  const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'yes', label: 'Attending' },
    { value: 'maybe', label: 'Maybe' },
    { value: 'no', label: 'Declined' }
  ];
  const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

  function getGuestCount(entry) {
    const parsed = parseInt(entry && entry.guest_count, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 1;
    }
    return parsed;
  }

  function formatGuests(count) {
    const safe = Number.isFinite(count) ? count : 0;
    return `${NUMBER_FORMAT.format(safe)} ${safe === 1 ? 'guest' : 'guests'}`;
  }

  function formatDateTime(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return DATE_FORMAT.format(parsed);
  }

  function normalizeStatus(value) {
    const normalized = (value || '').toString().toLowerCase();
    if (STATUS_LABELS[normalized]) {
      return normalized;
    }
    return 'yes';
  }

  function buildStats(responses) {
    return responses.reduce(
      (acc, entry) => {
        const status = normalizeStatus(entry.status);
        const guestCount = getGuestCount(entry);
        acc.totalResponses += 1;
        acc.totalGuests += guestCount;

        if (status === 'yes') {
          acc.attendingResponses += 1;
          acc.attendingGuests += guestCount;
        } else if (status === 'maybe') {
          acc.pendingResponses += 1;
        } else if (status === 'no') {
          acc.declinedResponses += 1;
        }
        return acc;
      },
      {
        totalResponses: 0,
        totalGuests: 0,
        attendingResponses: 0,
        attendingGuests: 0,
        pendingResponses: 0,
        declinedResponses: 0
      }
    );
  }

  function escapeCsvValue(value) {
    const str = (value ?? '').toString().replace(/[\r\n]+/g, ' ').trim();
    if (str.includes('"') || str.includes(',') || str.includes(';')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function buildCsv(rows) {
    const header = ['Name', 'Status', 'Guest Count', 'Guest Names', 'Message', 'Submitted At'].join(',');
    const body = rows
      .map((row) => {
        const status = STATUS_LABELS[normalizeStatus(row.status)] || 'Unknown';
        const guestNames = (row.guest_names || '').trim();
        return [
          escapeCsvValue(row.name || ''),
          escapeCsvValue(status),
          escapeCsvValue(getGuestCount(row)),
          escapeCsvValue(guestNames),
          escapeCsvValue((row.message || '').trim()),
          escapeCsvValue(formatDateTime(row.created_at))
        ].join(',');
      })
      .join('\n');

    return `${header}\n${body}`;
  }

  function useRsvpData() {
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchResponses = useCallback(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(RSVP_API_ROUTE, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error('Request failed');
        }
        const payload = await response.json();
        const entries = Array.isArray(payload.responses) ? payload.responses : [];
        setResponses(entries);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('[RSVP Dashboard] Failed to load responses', err);
        setError('Unable to load responses right now. Please try again.');
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchResponses();
    }, [fetchResponses]);

    return { responses, loading, error, lastUpdated, refetch: fetchResponses };
  }

  function StatsPanel({ stats }) {
    const cards = [
      {
        label: 'Total RSVPs',
        value: stats.totalResponses,
        detail: `${formatGuests(stats.totalGuests)} responded`
      },
      {
        label: 'Attending',
        value: stats.attendingResponses,
        detail: `Expecting ${formatGuests(stats.attendingGuests)}`
      },
      {
        label: 'Pending Reply',
        value: stats.pendingResponses,
        detail: 'Need gentle follow-up'
      },
      {
        label: 'Regrets',
        value: stats.declinedResponses,
        detail: 'Sending love from afar'
      }
    ];

    return e(
      'div',
      { className: 'stats-grid' },
      cards.map((card) =>
        e(
          'div',
          { className: 'stat-card', key: card.label },
          e('div', { className: 'stat-label' }, card.label),
          e('div', { className: 'stat-value' }, NUMBER_FORMAT.format(card.value || 0)),
          e('div', { className: 'stat-detail' }, card.detail)
        )
      )
    );
  }

  function FilterBar({
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusChange,
    onRefresh,
    refreshing,
    onExport,
    canExport,
    exporting,
    lastUpdated
  }) {
    const updatedLabel = lastUpdated ? `Last updated ${formatDateTime(lastUpdated)}` : '';

    return e(
      React.Fragment,
      null,
      e(
        'div',
        { className: 'filter-bar' },
        e(
          'div',
          { className: 'filter-search' },
          e('label', { htmlFor: 'rsvp-search' }, 'Search guest or note'),
          e('input', {
            id: 'rsvp-search',
            type: 'search',
            placeholder: 'Search by name, guest list, or message',
            value: searchTerm,
            onChange: (event) => onSearchChange(event.target.value)
          })
        ),
        e(
          'div',
          { className: 'filter-tabs', role: 'tablist', 'aria-label': 'Filter by RSVP status' },
          FILTER_OPTIONS.map((option) =>
            e(
              'button',
              {
                key: option.value,
                type: 'button',
                className:
                  'filter-status-btn' + (statusFilter === option.value ? ' is-active' : ''),
                onClick: () => onStatusChange(option.value),
                'aria-pressed': statusFilter === option.value
              },
              option.label
            )
          )
        ),
        e(
          'div',
          { className: 'filter-actions' },
          e(
            'button',
            {
              type: 'button',
              className: 'btn outline',
              onClick: onRefresh,
              disabled: refreshing
            },
            refreshing ? 'Refreshing...' : 'Refresh'
          ),
          e(
            'button',
            {
              type: 'button',
              className: 'btn primary',
              onClick: onExport,
              disabled: !canExport || exporting
            },
            exporting ? 'Exporting...' : 'Export CSV'
          )
        )
      ),
      updatedLabel && e('div', { className: 'filter-meta' }, updatedLabel)
    );
  }

  function ResponseTable({ responses, loading, error, onRetry, hasFilters }) {
    if (error) {
      return e(
        'div',
        { className: 'error-state' },
        e('p', null, error),
        e(
          'button',
          { type: 'button', className: 'btn outline', onClick: onRetry },
          'Try again'
        )
      );
    }

    if (loading && responses.length === 0) {
      return e('div', { className: 'empty-state' }, 'Loading responses&hellip;');
    }

    if (!loading && responses.length === 0) {
      return e(
        'div',
        { className: 'empty-state' },
        hasFilters
          ? 'No RSVP matches your filters. Adjust the search or status above.'
          : 'Once guests RSVP, their details will appear here automatically.'
      );
    }

    return e(
      'div',
      { className: 'table-wrapper' },
      e(
        'table',
        { className: 'response-table' },
        e(
          'thead',
          null,
          e(
            'tr',
            null,
            e('th', null, 'Guest'),
            e('th', null, 'Status'),
            e('th', null, 'Message'),
            e('th', null, 'Received')
          )
        ),
        e(
          'tbody',
          null,
          responses.map((entry) => {
            const status = normalizeStatus(entry.status);
            const guestCount = getGuestCount(entry);
            const message = (entry.message || '').trim();
            const combinedGuests = (entry.guest_names || '').trim();
            const hasGroupNames =
              combinedGuests &&
              combinedGuests.toLowerCase() !== (entry.name || '').trim().toLowerCase();
            const key = entry.id ?? entry.created_at ?? Math.random();
            return e(
              'tr',
              { key },
              e(
                'td',
                { 'data-label': 'Guest' },
                e('div', { className: 'cell-name' }, entry.name || 'Guest'),
                hasGroupNames && e('span', { className: 'guest-note' }, `Party: ${combinedGuests}`)
              ),
              e(
                'td',
                { 'data-label': 'Status' },
                e(
                  'span',
                  { className: `status-pill is-${status}` },
                  STATUS_LABELS[status] || 'Attending'
                ),
                e('span', { className: 'status-meta' }, formatGuests(guestCount))
              ),
              e(
                'td',
                { 'data-label': 'Message' },
                e(
                  'div',
                  {
                    className: 'message-text' + (message ? '' : ' is-empty'),
                    title: message || 'No message provided'
                  },
                  message || 'No message provided'
                )
              ),
              e(
                'td',
                { 'data-label': 'Received' },
                e('span', { className: 'timestamp' }, formatDateTime(entry.created_at))
              )
            );
          })
        )
      )
    );
  }

  function ManageApp() {
    const { responses, loading, error, lastUpdated, refetch } = useRsvpData();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [exporting, setExporting] = useState(false);

    const stats = useMemo(() => buildStats(responses), [responses]);
    const term = searchTerm.trim().toLowerCase();

    const filteredResponses = useMemo(() => {
      return responses.filter((entry) => {
        const status = normalizeStatus(entry.status);
        if (statusFilter !== 'all' && status !== statusFilter) {
          return false;
        }
        if (!term) return true;
        const haystack = [
          entry.name || '',
          entry.message || '',
          entry.guest_names || ''
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
    }, [responses, statusFilter, term]);

    const handleExport = useCallback(() => {
      if (!filteredResponses.length) return;
      try {
        setExporting(true);
        const csv = buildCsv(filteredResponses);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rsvp-responses.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 0);
      } catch (err) {
        console.error('[RSVP Dashboard] Failed to export CSV', err);
        alert('Unable to export responses right now. Please try again.');
      } finally {
        setExporting(false);
      }
    }, [filteredResponses]);

    const hasFilters = Boolean(term || statusFilter !== 'all');

    return e(
      'div',
      { className: 'manage-dashboard' },
      e('section', { className: 'card stats-panel' }, e(StatsPanel, { stats })),
      e(
        'section',
        { className: 'card responses-panel' },
        e(FilterBar, {
          searchTerm,
          statusFilter,
          onSearchChange: setSearchTerm,
          onStatusChange: setStatusFilter,
          onRefresh: refetch,
          refreshing: loading,
          onExport: handleExport,
          canExport: filteredResponses.length > 0,
          exporting,
          lastUpdated
        }),
        e(ResponseTable, {
          responses: filteredResponses,
          loading,
          error,
          onRetry: refetch,
          hasFilters
        })
      )
    );
  }

  function mount() {
    const root = document.getElementById('rsvpDashboard');
    if (root) {
      ReactDOM.createRoot(root).render(e(ManageApp));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

