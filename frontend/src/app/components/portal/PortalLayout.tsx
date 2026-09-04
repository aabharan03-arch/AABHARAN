import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { SecondaryNav, SecondaryNavItem, Avatar } from '@figma/astraui';
import { Home, Package, Store, MessageSquare, LogOut, X } from 'lucide-react';
import { ENQUIRIES } from '../data/mockData';

// Base API endpoint for store admin actions
const API_BASE_URL = 'https://aabharan.vercel.app/api/storeadmin';

// ---------------------------------------------------------------------------
// Design tokens — shared with DashboardPage (ivory / deep navy / warm gold)
// ---------------------------------------------------------------------------
const T = {
  ivory: '#f9f7ee',
  ivoryShade: '#eeead9',
  navy: '#0f1428',
  navySoft: '#1b2140',
  gold: '#c9a44c',
  goldSoft: '#e4d6ab',
  textMuted: '#9aa0b4',
  textFaint: '#6d7286',
  danger: '#b0473f',
  dangerSoft: '#f6e3e1',
};

interface StoreAdminUser {
  id: string;
  email: string;
  name?: string;
  status: string;
  role: string;
}

export function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const newEnquiries = ENQUIRIES.filter(e => e.status === 'New').length;

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [user, setUser] = useState<StoreAdminUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const secondaryNavItems = [
    // { icon: Home, path: '/portal', label: 'Dashboard' },
    { icon: Package, path: '/portal/products', label: 'Products' },
    { icon: Store, path: '/portal/store', label: 'Store Settings' },
    { icon: MessageSquare, path: '/portal/enquiries', label: 'Enquiries' },
    {icon:Package, path:'/portal/categories', label:'Categories'},
    {icon:Package, path:'/portal/metal-types', label:'Metal Type'},
  ];

  // Helper to retrieve token from either localStorage or sessionStorage
  function getAuthToken(): string | null {
    return localStorage.getItem('storeadmin_token') || sessionStorage.getItem('storeadmin_token');
  }

  // Clear local storage and send user back to login page
  function clearAuthSession() {
    localStorage.removeItem('storeadmin_token');
    localStorage.removeItem('storeadmin_user');
    sessionStorage.removeItem('storeadmin_token');
    sessionStorage.removeItem('storeadmin_user');
    navigate('/portal/login', { replace: true });
  }

  // Verify session with `/me` endpoint on layout mount
  useEffect(() => {
    async function verifySession() {
      const token = getAuthToken();

      if (!token) {
        clearAuthSession();
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          clearAuthSession();
          return;
        }

        const data = await response.json();
        setUser(data.storeAdmin);
      } catch (err) {
        console.error('Session verification failed:', err);
        clearAuthSession();
      } finally {
        setLoadingUser(false);
      }
    }

    verifySession();
  }, []);

  // Handle Logout Confirmation
  async function confirmLogout() {
    setIsLoggingOut(true);
    const token = getAuthToken();

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    setLogoutConfirmOpen(false);
    setIsLoggingOut(false);
    clearAuthSession();
    localStorage.clear();
    sessionStorage.clear();
  }

  // Fallback to name from database ("Suvarna" by default in Prisma schema)
  const adminName = user?.name || 'Suvarna';

  // Compute initials from admin name or email
  const getUserInitials = (): string => {
    if (adminName) {
      const parts = adminName.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return adminName.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'SU';
  };

  if (loadingUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ backgroundColor: T.navy }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#c9a44c]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span style={{ color: T.ivory, fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Loading partner portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: T.ivory }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');

        /* Single sidebar — deep navy, all text/icons forced light for visibility */
        .portal-sidebar { background-color: ${T.navy} !important; border-right: 1px solid ${T.navySoft}; }
        .portal-sidebar,
        .portal-sidebar * { color: ${T.textMuted}; }

        .portal-sidebar button svg,
        .portal-sidebar [role="button"] svg { color: ${T.textMuted} !important; stroke: ${T.textMuted} !important; }

        .portal-sidebar button:hover,
        .portal-sidebar [role="button"]:hover {
          background-color: ${T.navySoft} !important;
        }
        .portal-sidebar button:hover *,
        .portal-sidebar [role="button"]:hover * { color: ${T.ivory} !important; stroke: ${T.ivory} !important; }

        .portal-sidebar [data-active="true"],
        .portal-sidebar [aria-current="true"] {
          background-color: ${T.navySoft} !important;
          box-shadow: inset 3px 0 0 ${T.gold};
        }
        .portal-sidebar [data-active="true"] *,
        .portal-sidebar [aria-current="true"] * {
          color: ${T.gold} !important;
          stroke: ${T.gold} !important;
          font-weight: 600;
        }
      `}</style>

      {/* Sidebar — single nav */}
      <div className="portal-sidebar flex flex-col" style={{ width: '260px', flexShrink: 0 }}>
        <SecondaryNav
          title={
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: T.ivory, fontSize: '22px', letterSpacing: '-0.01em' }}>
              {adminName}'s <span style={{ color: T.gold }}>Portal</span>
            </span>
          }
        >
          {secondaryNavItems.map(item => {
            const Icon = item.icon;
            const isActive = item.path === '/portal' ? location.pathname === '/portal' : location.pathname.startsWith(item.path);
            return (
              <SecondaryNavItem
                key={item.path}
                icon={<Icon className="size-full" strokeWidth={1.5} color={isActive ? T.gold : T.textMuted} />}
                label={item.label === 'Enquiries' && newEnquiries > 0 ? `Enquiries (${newEnquiries})` : item.label}
                active={isActive}
                onClick={() => navigate(item.path)}
              />
            );
          })}

          {/* Footer: Dynamic avatar + Admin name */}
          <div className="mt-auto flex items-center justify-between pt-lg" style={{ borderTop: `1px solid ${T.navySoft}` }}>
            <div className="flex items-center gap-md min-w-0 pr-2">
              <Avatar type="initial" initials={getUserInitials()} size="medium" shape="circle" style={{ backgroundColor: T.gold, color: T.navy }} />
              <div className="flex flex-col min-w-0">
                <span className="truncate" style={{ fontSize: '13px', color: T.ivory, fontWeight: 500 }}>
                  {adminName}
                </span>
                <span className="truncate" style={{ fontSize: '11px', color: T.textFaint }}>
                  Store Admin
                </span>
              </div>
            </div>
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              aria-label="Logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
            >
              <LogOut size={18} strokeWidth={1.5} color={T.textMuted} />
            </button>
          </div>
        </SecondaryNav>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-2xl overflow-y-auto" style={{ backgroundColor: T.ivory }}>
        <Outlet context={{ user }} />
      </main>

      {/* Logout Confirmation Dialog */}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-lg"
          style={{ backgroundColor: 'rgba(4, 9, 30, 0.6)', zIndex: 200 }}
          onClick={() => !isLoggingOut && setLogoutConfirmOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '380px',
              border: `1px solid ${T.ivoryShade}`,
              boxShadow: '0 24px 60px rgba(4, 9, 30, 0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: `1px solid ${T.ivoryShade}` }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 500, color: T.navy }}>
                Log Out
              </h2>
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={isLoggingOut}
                aria-label="Close"
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', backgroundColor: T.ivory, border: 'none', cursor: 'pointer',
                }}
              >
                <X size={15} color={T.navy} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center text-center gap-md" style={{ padding: '28px 24px' }}>
              <div
                style={{
                  width: '48px', height: '48px', borderRadius: '50%', backgroundColor: T.dangerSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LogOut size={20} color={T.danger} strokeWidth={1.75} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: T.navy, marginBottom: '6px' }}>
                  Are you sure you want to log out?
                </p>
                <p style={{ fontSize: '12.5px', color: T.textFaint, lineHeight: 1.55 }}>
                  You'll need to sign in again to access {adminName}'s Portal.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-md" style={{ padding: '16px 24px', borderTop: `1px solid ${T.ivoryShade}` }}>
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={isLoggingOut}
                className="flex-1"
                style={{
                  fontSize: '13px', fontWeight: 500, color: T.navy, backgroundColor: '#fff',
                  border: `1px solid ${T.ivoryShade}`, borderRadius: '10px', padding: '11px 18px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  fontSize: '13px', fontWeight: 600, color: '#fff', backgroundColor: T.danger,
                  border: 'none', borderRadius: '10px', padding: '11px 18px', cursor: 'pointer',
                  opacity: isLoggingOut ? 0.7 : 1,
                }}
              >
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}