import { useState, useEffect, useCallback } from 'react';
import { Search, Mail, Calendar, X, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

const STATUS_OPTIONS = ['New', 'Contacted', 'Closed'] as const;
type DisplayStatus = (typeof STATUS_OPTIONS)[number];

// Backend enum <-> display label mapping
const STATUS_TO_API: Record<DisplayStatus, string> = {
  New: 'NEW',
  Contacted: 'CONTACTED',
  Closed: 'CLOSED',
};
const STATUS_FROM_API: Record<string, DisplayStatus> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  CLOSED: 'Closed',
};

interface Enquiry {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  productName: string;
  message: string;
  date: string;
  status: DisplayStatus;
}

// Raw shape returned by GET /api/storeadmin/enquiries
interface ApiEnquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
  product: { id: string; name: string; images: string[]; category: string } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapApiEnquiry(e: ApiEnquiry): Enquiry {
  return {
    id: e.id,
    customerName: e.fullName,
    email: e.email,
    phone: e.phone || 'Not provided',
    productName: e.product?.name || 'Unknown product',
    message: e.message,
    date: formatDate(e.createdAt),
    status: STATUS_FROM_API[e.status] || 'New',
  };
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('storeadmin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Design tokens — shared with DashboardPage / PortalLayout
// ---------------------------------------------------------------------------
const T = {
  ivory: '#f9f7ee',
  ivoryShade: '#eeead9',
  navy: '#04091e',
  gold: '#c9a44c',
  goldSoft: '#e4d6ab',
  muted: '#6b6b5f',
};

export function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/storeadmin/enquiries`, {
        headers: { ...authHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load enquiries.');
      }
      const mapped: Enquiry[] = (data.enquiries ?? []).map(mapApiEnquiry);
      setEnquiries(mapped);
    } catch (err: any) {
      console.error('Failed to fetch enquiries:', err);
      setError(err.message || 'Something went wrong while loading enquiries.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const filtered = enquiries.filter(e => {
    const matchesQuery = !query || e.customerName.toLowerCase().includes(query.toLowerCase()) || e.productName.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  async function updateStatus(id: string, status: DisplayStatus) {
    const previous = enquiries;
    setStatusUpdating(true);

    // optimistic update
    setEnquiries(es => es.map(e => e.id === id ? { ...e, status } : e));
    if (selectedEnquiry?.id === id) setSelectedEnquiry(e => e ? { ...e, status } : e);

    try {
      const res = await fetch(`${API_BASE_URL}/api/storeadmin/enquiries`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ enquiryId: id, status: STATUS_TO_API[status] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }
    } catch (err: any) {
      console.error('Failed to update enquiry status:', err);
      // revert on failure
      setEnquiries(previous);
      if (selectedEnquiry?.id === id) {
        const reverted = previous.find(e => e.id === id);
        if (reverted) setSelectedEnquiry(reverted);
      }
    } finally {
      setStatusUpdating(false);
    }
  }

  const statusColors = (s: Enquiry['status']) =>
    s === 'New'
      ? { bg: T.goldSoft, fg: T.navy }
      : s === 'Contacted'
          ? { bg: '#dcebe1', fg: '#2f6b47' }
          : { bg: T.ivoryShade, fg: T.muted };

  return (
    <div className="flex flex-col gap-xl" style={{ fontFamily: 'Inter, var(--font-family-sans)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {/* Header */}
      <div>
        <p style={{ color: T.gold, fontSize: '11px', letterSpacing: '0.18em', fontWeight: 600, textTransform: 'uppercase' }}>
          Tanishq · Portal
        </p>
        <h1
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: '30px',
            fontWeight: 500,
            color: T.navy,
            marginTop: '6px',
            letterSpacing: '-0.01em',
          }}
        >
          Enquiries
        </h1>
        <div style={{ width: '40px', height: '2px', backgroundColor: T.gold, marginTop: '12px', marginBottom: '10px' }} />
        <p style={{ color: T.muted, fontSize: '13px' }}>
          {filtered.length} enquiry{filtered.length !== 1 ? 'ies' : 'y'} · {enquiries.filter(e => e.status === 'New').length} new
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '16px 20px',
          border: `1px solid #e5e7eb`,
        }}
        className="flex flex-col md:flex-row md:items-center gap-4"
      >
        <div className="relative flex-shrink-0 w-full md:w-[360px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or product..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-xl text-sm focus:outline-none transition-all border"
            style={{
              fontFamily: 'Inter, var(--font-family-sans)',
              backgroundColor: '#f9f7ee',
              borderColor: '#e5e7eb',
              color: '#04091e',
              paddingLeft: '40px',
              paddingRight: '14px',
              height: '42px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#04091e')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1">
          {['All', ...STATUS_OPTIONS].map(s => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border"
                style={{
                  padding: '10px 18px',
                  backgroundColor: active ? '#04091e' : '#f9f7ee',
                  color: active ? '#ffffff' : '#6b7280',
                  borderColor: active ? '#04091e' : '#e5e7eb',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          className="flex items-center justify-center gap-2 py-16"
          style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: `1px solid ${T.ivoryShade}` }}
        >
          <Loader2 size={18} className="animate-spin" style={{ color: T.muted }} />
          <span style={{ fontSize: '13.5px', color: T.muted }}>Loading enquiries...</span>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div
          className="flex items-start gap-3 p-4"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '16px',
            color: '#b91c1c',
          }}
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p style={{ fontSize: '13.5px', fontWeight: 600 }}>{error}</p>
            <button
              onClick={loadEnquiries}
              style={{ fontSize: '12.5px', fontWeight: 600, textDecoration: 'underline', marginTop: '4px', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: `1px solid ${T.ivoryShade}`, overflow: 'hidden' }}>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: T.ivory, borderBottom: `1px solid ${T.ivoryShade}` }}>
                  {['Customer', 'Product', 'Date', 'Status', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="text-left px-xl py-lg"
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: T.muted,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(enq => {
                  const colors = statusColors(enq.status);
                  return (
                    <tr
                      key={enq.id}
                      style={{ borderBottom: `1px solid ${T.ivoryShade}` }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.ivory)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      className="transition-colors"
                    >
                      <td className="px-xl py-lg">
                        <p style={{ fontSize: '13.5px', fontWeight: 500, color: T.navy }}>{enq.customerName}</p>
                        <div className="flex items-center gap-sm mt-xs">
                          <Mail size={11} color={T.muted} />
                          <span style={{ fontSize: '12px', color: T.muted }}>{enq.email}</span>
                        </div>
                      </td>
                      <td className="px-xl py-lg">
                        <p style={{ fontSize: '13.5px', color: T.navy }}>{enq.productName}</p>
                        <p style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }} className="line-clamp-1">
                          {enq.message}
                        </p>
                      </td>
                      <td className="px-xl py-lg">
                        <div className="flex items-center gap-xs">
                          <Calendar size={12} color={T.muted} />
                          <span style={{ fontSize: '13px', color: T.muted }}>{enq.date}</span>
                        </div>
                      </td>
                      <td className="px-xl py-lg">
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: colors.bg,
                            color: colors.fg,
                          }}
                        >
                          {enq.status}
                        </span>
                      </td>
                      <td className="px-xl py-lg">
                        <button
                          onClick={() => setSelectedEnquiry(enq)}
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 500,
                            color: T.navy,
                            border: `1px solid ${T.ivoryShade}`,
                            borderRadius: '8px',
                            padding: '6px 14px',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = T.gold)}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = T.ivoryShade)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col">
            {filtered.map(enq => {
              const colors = statusColors(enq.status);
              return (
                <div
                  key={enq.id}
                  className="p-xl flex flex-col gap-md"
                  style={{ borderBottom: `1px solid ${T.ivoryShade}` }}
                  onClick={() => setSelectedEnquiry(enq)}
                >
                  <div className="flex items-start justify-between gap-md">
                    <div>
                      <p style={{ fontSize: '13.5px', fontWeight: 500, color: T.navy }}>{enq.customerName}</p>
                      <p style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>{enq.productName}</p>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        backgroundColor: colors.bg,
                        color: colors.fg,
                        flexShrink: 0,
                      }}
                    >
                      {enq.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: T.muted }} className="line-clamp-2">{enq.message}</p>
                  <p style={{ fontSize: '12px', color: T.muted }}>{enq.date}</p>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="p-2xl text-center">
              <p style={{ fontSize: '13.5px', color: T.muted }}>No enquiries found.</p>
            </div>
          )}
        </div>
      )}

      {/* Enquiry Detail Modal — fully custom, matches ivory/navy system */}
      {selectedEnquiry && (
        <div
          className="fixed inset-0 flex items-center justify-center p-lg"
          style={{ backgroundColor: 'rgba(4, 9, 30, 0.55)', zIndex: 100 }}
          onClick={() => { setSelectedEnquiry(null); setStatusMenuOpen(false); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '88vh',
              overflowY: 'auto',
              border: `1px solid ${T.ivoryShade}`,
              boxShadow: '0 24px 60px rgba(4, 9, 30, 0.25)',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between"
              style={{ padding: '22px 26px', borderBottom: `1px solid ${T.ivoryShade}` }}
            >
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 500, color: T.navy }}>
                Enquiry Details
              </h2>
              <button
                onClick={() => { setSelectedEnquiry(null); setStatusMenuOpen(false); }}
                aria-label="Close"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: T.ivory,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} color={T.navy} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col gap-md" style={{ padding: '22px 26px', fontFamily: 'Inter, var(--font-family-sans)' }}>
              <div className="grid grid-cols-2 gap-md">
                <div style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', color: T.muted, marginBottom: '5px' }}>Customer Name</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: T.navy }}>{selectedEnquiry.customerName}</p>
                </div>
                <div style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', color: T.muted, marginBottom: '5px' }}>Status</p>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: statusColors(selectedEnquiry.status).bg,
                      color: statusColors(selectedEnquiry.status).fg,
                    }}
                  >
                    {selectedEnquiry.status}
                  </span>
                </div>
                <div style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', color: T.muted, marginBottom: '5px' }}>Email</p>
                  <p style={{ fontSize: '13.5px', color: T.navy }}>{selectedEnquiry.email}</p>
                </div>
                <div style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '14px' }}>
                  <p style={{ fontSize: '11px', color: T.muted, marginBottom: '5px' }}>Phone</p>
                  <p style={{ fontSize: '13.5px', color: T.navy }}>{selectedEnquiry.phone}</p>
                </div>
              </div>
              <div style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: T.muted, marginBottom: '5px' }}>Product</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: T.navy }}>{selectedEnquiry.productName}</p>
              </div>
              <div style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: T.muted, marginBottom: '5px' }}>Message</p>
                <p style={{ fontSize: '13.5px', color: T.navy, lineHeight: 1.55 }}>{selectedEnquiry.message}</p>
              </div>
              <div style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: T.muted, marginBottom: '5px' }}>Date</p>
                <p style={{ fontSize: '13.5px', color: T.navy }}>{selectedEnquiry.date}</p>
              </div>
            </div>

            {/* Modal footer */}
            <div
              className="flex items-center justify-end gap-md"
              style={{ padding: '18px 26px', borderTop: `1px solid ${T.ivoryShade}` }}
            >
              <button
                onClick={() => { setSelectedEnquiry(null); setStatusMenuOpen(false); }}
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: T.navy,
                  backgroundColor: '#fff',
                  border: `1px solid ${T.ivoryShade}`,
                  borderRadius: '10px',
                  padding: '10px 18px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              <div className="relative">
                <button
                  onClick={() => setStatusMenuOpen(o => !o)}
                  disabled={statusUpdating}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: T.gold,
                    backgroundColor: T.navy,
                    border: `1px solid ${T.navy}`,
                    borderRadius: '10px',
                    padding: '10px 18px',
                    cursor: statusUpdating ? 'not-allowed' : 'pointer',
                    opacity: statusUpdating ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '150px',
                    justifyContent: 'space-between',
                  }}
                >
                  {statusUpdating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      {selectedEnquiry.status}
                      <span style={{ fontSize: '10px' }}>{statusMenuOpen ? '▲' : '▼'}</span>
                    </>
                  )}
                </button>
                {statusMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      right: 0,
                      backgroundColor: '#fff',
                      border: `1px solid ${T.ivoryShade}`,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      minWidth: '150px',
                      boxShadow: '0 12px 28px rgba(4, 9, 30, 0.18)',
                      zIndex: 10,
                    }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => { updateStatus(selectedEnquiry.id, s); setStatusMenuOpen(false); }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: s === selectedEnquiry.status ? 600 : 400,
                          color: s === selectedEnquiry.status ? T.navy : T.muted,
                          backgroundColor: s === selectedEnquiry.status ? T.ivory : '#fff',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.ivory)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = s === selectedEnquiry.status ? T.ivory : '#fff')}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}