import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, MapPin, Phone, Globe, MessageCircle, Mail, Instagram, Facebook, Edit, X, Check, Lock, AlertCircle } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import {
  fetchStoreSettings,
  updateStoreSettings,
  updateStoreAssets,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../../lib/api';

// API helper
export async function changePassword(currentPassword: string, newPassword: string) {
  const API_BASE_URL = ''; // Ensure your API_BASE_URL is set or imported
  const authHeaders = () => ({ Authorization: `Bearer ${sessionStorage.getItem('storeadmin_token') ?? ''}` });

  const res = await fetch(`${API_BASE_URL}/api/storeadmin/settings/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to change password (${res.status})`);
  }

  const data = await res.json();
  return data.message as string;
}

export interface Branch {
  id: string;
  name: string;
  managerName?: string;
  phone?: string;
  whatsapp?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
}

export interface Store {
  id: string;
  name: string;
  about?: string;
  logo?: string;
  coverBanner?: string;
  contactNumber?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  branches: Branch[];
}

const T = {
  ivory: '#f9f7ee',
  ivoryShade: '#eeead9',
  navy: '#04091e',
  gold: '#c9a44c',
  goldSoft: '#e4d6ab',
  muted: '#6b6b5f',
  danger: '#b0473f',
  dangerSoft: '#f6e3e1',
  success: '#3f7a5c',
  successSoft: '#dcebe1',
};

const CACHE_KEY = 'store_settings_cache';

const inputStyle: React.CSSProperties = {
  fontFamily: 'Inter, var(--font-family-sans)',
  backgroundColor: T.ivory,
  border: `1px solid ${T.ivoryShade}`,
  color: T.navy,
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '13.5px',
  width: '100%',
  outline: 'none',
};
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: T.muted, marginBottom: '6px', display: 'block' };

function Field({ label, icon, ...props }: { label: string; icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex-1">
      <label style={labelStyle}>{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input {...props} style={{ ...inputStyle, paddingLeft: icon ? '36px' : '12px' }} />
      </div>
    </div>
  );
}

/* Toast Component */
interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

function ToastContainer({ toasts, onClose }: { toasts: ToastMessage[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-center justify-between p-4 rounded-xl shadow-lg border transition-all duration-300 animate-slide-in"
          style={{
            backgroundColor: toast.type === 'success' ? '#ffffff' : '#ffffff',
            borderColor: toast.type === 'success' ? T.success : T.danger,
            borderLeftWidth: '5px',
          }}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <Check size={18} style={{ color: T.success }} />
            ) : (
              <AlertCircle size={18} style={{ color: T.danger }} />
            )}
            <span style={{ fontSize: '13.5px', color: T.navy, fontWeight: 500 }}>{toast.text}</span>
          </div>
          <button
            onClick={() => onClose(toast.id)}
            className="p-1 hover:bg-black/5 rounded-md transition-colors"
          >
            <X size={14} color={T.muted} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function StorePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'branches'>('info');
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const triggerToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateStoreAndCache = (updater: Store | null | ((prev: Store | null) => Store | null)) => {
    setStore(prev => {
      const nextStore = typeof updater === 'function' ? updater(prev) : updater;
      if (nextStore) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(nextStore));
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
      return nextStore;
    });
  };

  const loadStore = useCallback(async (ignoreCache = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!ignoreCache) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setStore(parsed);
            setLoading(false);
            return;
          } catch {
            localStorage.removeItem(CACHE_KEY);
          }
        }
      }

      const data = await fetchStoreSettings();
      setStore(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err: any) {
      const msg = err.message || 'Failed to load store settings.';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const TABS = useMemo(() => {
    const branchCount = store?.branches?.length ?? 0;
    return [
      { key: 'info', label: 'Store Information' },
      { key: 'branches', label: `Branches (${branchCount})` },
    ] as const;
  }, [store?.branches?.length]);

  async function handleSaveStore() {
    if (!store) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateStoreSettings({
        name: store.name,
        about: store.about,
        contactNumber: store.contactNumber,
        whatsapp: store.whatsapp,
        email: store.email,
        website: store.website,
        socialLinks: {
          instagram: store.instagram,
          facebook: store.facebook,
        },
      });

      updateStoreAndCache(prev => (prev ? { ...prev, ...updated } : updated));
      triggerToast('Store information updated successfully!');
    } catch (err: any) {
      const msg = err.message || 'Failed to save store info.';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('Please fill in all password fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerToast('New password and confirmation password do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      triggerToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      setPasswordSaving(true);
      const message = await changePassword(currentPassword, newPassword);
      triggerToast(message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    try {
      setSaving(true);
      setError(null);
      const fd = new FormData();
      fd.append('logo', file);
      const updated = await updateStoreAssets(fd);
      updateStoreAndCache(prev => (prev ? { ...prev, ...updated } : updated));
      triggerToast('Company logo updated successfully!');
    } catch (err: any) {
      const msg = err.message || 'Failed to upload logo.';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    try {
      setSaving(true);
      setError(null);
      const fd = new FormData();
      fd.append('coverBanner', file);
      const updated = await updateStoreAssets(fd);
      updateStoreAndCache(prev => (prev ? { ...prev, ...updated } : updated));
      triggerToast('Cover banner updated successfully!');
    } catch (err: any) {
      const msg = err.message || 'Failed to upload cover banner.';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBranch(branch: Branch) {
    try {
      setSaving(true);
      setError(null);
      await deleteBranch(branch.id);
      updateStoreAndCache(s => (s ? { ...s, branches: s.branches.filter(b => b.id !== branch.id) } : null));
      setBranchToDelete(null);
      triggerToast(`Branch "${branch.name}" deleted successfully.`);
    } catch (err: any) {
      const msg = err.message || 'Failed to delete branch.';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBranch(branchData: Partial<Branch>) {
    try {
      setSaving(true);
      setError(null);
      if (editBranch) {
        const updated = await updateBranch(editBranch.id, branchData);
        updateStoreAndCache(s => (s ? { ...s, branches: s.branches.map(b => (b.id === updated.id ? updated : b)) } : null));
        setEditBranch(null);
        triggerToast('Branch updated successfully!');
      } else {
        const created = await createBranch(branchData);
        updateStoreAndCache(s => (s ? { ...s, branches: [...s.branches, created] } : null));
        setAddBranchOpen(false);
        triggerToast('New branch added successfully!');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to save branch.';
      setError(msg);
      triggerToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <StorePageSkeleton />;
  }

  if (!store) {
    return (
      <div className="p-xl text-center">
        <p style={{ color: T.danger, fontSize: '14px' }}>{error || 'Unable to load store data.'}</p>
        <button
          onClick={() => loadStore(true)}
          style={{ marginTop: '12px', fontSize: '13px', color: T.navy, backgroundColor: T.ivory, border: `1px solid ${T.ivoryShade}`, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl relative" style={{ fontFamily: 'Inter, var(--font-family-sans)' }}>
      {/* Toast Render */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Sticky Fixed Header */}
      {/* Sticky Fixed Header */}
      <div
        className="sticky top-0 z-30 border-b border-[#eeead9] -mx-6 px-6 sm:-mx-8 sm:px-8 -mt-6 pt-6 pb-4"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-lg">
          <div>
            <p style={{ color: T.gold, fontSize: '11px', letterSpacing: '0.18em', fontWeight: 600, textTransform: 'uppercase' }}>
              Store Admin · Portal
            </p>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 500, color: T.navy, marginTop: '2px', letterSpacing: '-0.01em' }}>
              Store Settings
            </h1>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: T.dangerSoft, color: T.danger, padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px' }}>
          {error}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-xl" style={{ borderBottom: `1px solid ${T.ivoryShade}` }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="transition-colors"
              style={{
                fontFamily: 'Inter, var(--font-family-sans)',
                padding: '12px 2px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: active ? T.navy : T.muted,
                borderBottom: `2px solid ${active ? T.gold : 'transparent'}`,
                marginBottom: '-1px',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Store Info Tab */}
      {activeTab === 'info' && (
        <div className="flex flex-col gap-xl max-w-3xl">
          {/* Logo & Banner */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 500, color: T.navy, marginBottom: '18px' }}>Brand Assets</h2>
            <div className="flex flex-col gap-lg">
              <div className="flex items-center gap-xl">
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${T.ivoryShade}`, flexShrink: 0, backgroundColor: T.ivory }}>
                  {store.logo ? <img src={store.logo} alt="Logo" className="w-full h-full object-cover" /> : null}
                </div>
                <div>
                  <p style={{ fontSize: '13.5px', fontWeight: 500, color: T.navy }}>Company Logo</p>
                  <p style={{ fontSize: '12px', color: T.muted, marginBottom: '8px' }}>Recommended: 200×200px, PNG or JPG</p>
                  <input
                    type="file"
                    accept="image/*"
                    id="logo-upload-input"
                    style={{ display: 'none' }}
                    onChange={handleLogoFileChange}
                  />
                  <label
                    htmlFor="logo-upload-input"
                    style={{
                      fontSize: '12.5px', fontWeight: 600, color: T.navy, backgroundColor: T.ivory,
                      border: `1px solid ${T.ivoryShade}`, borderRadius: '8px', padding: '7px 14px',
                      cursor: saving ? 'not-allowed' : 'pointer', display: 'inline-block', opacity: saving ? 0.6 : 1,
                    }}
                  >
                    Change Logo
                  </label>
                </div>
              </div>

              <div>
                <div style={{ height: '112px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${T.ivoryShade}`, marginBottom: '8px', backgroundColor: T.ivory }}>
                  {store.coverBanner ? <img src={store.coverBanner} alt="Banner" className="w-full h-full object-cover" /> : null}
                </div>
                <p style={{ fontSize: '12px', color: T.muted, marginBottom: '8px' }}>Recommended: 1200×400px, JPG</p>
                <input
                  type="file"
                  accept="image/*"
                  id="banner-upload-input"
                  style={{ display: 'none' }}
                  onChange={handleBannerFileChange}
                />
                <label
                  htmlFor="banner-upload-input"
                  style={{
                    fontSize: '12.5px', fontWeight: 600, color: T.navy, backgroundColor: T.ivory,
                    border: `1px solid ${T.ivoryShade}`, borderRadius: '8px', padding: '7px 14px',
                    cursor: saving ? 'not-allowed' : 'pointer', display: 'inline-block', opacity: saving ? 0.6 : 1,
                  }}
                >
                  Change Cover Banner
                </label>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 500, color: T.navy, marginBottom: '18px' }}>Basic Information</h2>
            <div className="flex flex-col gap-lg">
              <div>
                <label style={labelStyle}>Store Name</label>
                <input style={inputStyle} value={store.name ?? ''} onChange={e => setStore(s => (s ? { ...s, name: e.target.value } : null))} />
              </div>
              <div>
                <label style={labelStyle}>About Your Store</label>
                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={store.about ?? ''} onChange={e => setStore(s => (s ? { ...s, about: e.target.value } : null))} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 500, color: T.navy, marginBottom: '18px' }}>Contact Information</h2>
            <div className="flex flex-col gap-lg">
              <div className="flex gap-lg flex-col sm:flex-row">
                <Field label="Phone Number" icon={<Phone size={15} color={T.muted} />} value={store.contactNumber ?? ''} onChange={e => setStore(s => (s ? { ...s, contactNumber: e.target.value } : null))} />
                <Field label="WhatsApp" icon={<MessageCircle size={15} color={T.muted} />} value={store.whatsapp ?? ''} onChange={e => setStore(s => (s ? { ...s, whatsapp: e.target.value } : null))} />
              </div>
              <div className="flex gap-lg flex-col sm:flex-row">
                <Field label="Email" icon={<Mail size={15} color={T.muted} />} value={store.email ?? ''} onChange={e => setStore(s => (s ? { ...s, email: e.target.value } : null))} />
                <Field label="Website" icon={<Globe size={15} color={T.muted} />} value={store.website ?? ''} onChange={e => setStore(s => (s ? { ...s, website: e.target.value } : null))} />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 500, color: T.navy, marginBottom: '18px' }}>Social Media</h2>
            <div className="flex flex-col gap-lg">
              <Field
                label="Instagram"
                icon={<Instagram size={15} color={T.muted} />}
                value={store.instagram ?? ''}
                onChange={e => setStore(s => (s ? { ...s, instagram: e.target.value } : null))}
              />
              <Field
                label="Facebook"
                icon={<Facebook size={15} color={T.muted} />}
                value={store.facebook ?? ''}
                onChange={e => setStore(s => (s ? { ...s, facebook: e.target.value } : null))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveStore}
              disabled={saving}
              style={{ fontSize: '13px', fontWeight: 600, color: T.gold, backgroundColor: T.navy, border: 'none', borderRadius: '10px', padding: '11px 22px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Change Password Card Section */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 500, color: T.navy, marginBottom: '18px' }}>
              Change Password
            </h2>

            <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-lg">
              <Field
                label="Current Password *"
                type="password"
                placeholder="Enter current password"
                icon={<Lock size={15} color={T.muted} />}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />

              <div className="flex gap-lg flex-col sm:flex-row">
                <Field
                  label="New Password *"
                  type="password"
                  placeholder="Enter new password"
                  icon={<Lock size={15} color={T.muted} />}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <Field
                  label="Confirm New Password *"
                  type="password"
                  placeholder="Confirm new password"
                  icon={<Lock size={15} color={T.muted} />}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end" style={{ marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: T.navy,
                    backgroundColor: T.ivory,
                    border: `1px solid ${T.ivoryShade}`,
                    borderRadius: '10px',
                    padding: '10px 20px',
                    cursor: passwordSaving ? 'not-allowed' : 'pointer',
                    opacity: passwordSaving ? 0.7 : 1,
                  }}
                >
                  {passwordSaving ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div className="flex flex-col gap-xl">
          <div className="flex justify-end">
            <button
              onClick={() => setAddBranchOpen(true)}
              className="flex items-center gap-xs"
              style={{ fontSize: '13px', fontWeight: 600, color: T.gold, backgroundColor: T.navy, border: 'none', borderRadius: '10px', padding: '11px 20px', cursor: 'pointer' }}
            >
              <Plus size={16} /> Add Branch
            </button>
          </div>

          {store.branches.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: `1px solid ${T.ivoryShade}`, textAlign: 'center' }}>
              <p style={{ color: T.muted, fontSize: '14px' }}>No branches added yet.</p>
            </div>
          ) : (
            store.branches.map(branch => (
              <div key={branch.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
                <div className="flex items-start justify-between gap-md" style={{ marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 500, color: T.navy }}>{branch.name}</h3>
                    {branch.managerName && <p style={{ fontSize: '12.5px', color: T.muted, marginTop: '4px' }}>Manager: {branch.managerName}</p>}
                  </div>
                  <div className="flex gap-sm">
                    <button
                      onClick={() => setEditBranch(branch)}
                      className="flex items-center justify-center transition-colors"
                      style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: T.ivory, border: `1px solid ${T.ivoryShade}`, cursor: 'pointer' }}
                    >
                      <Edit size={15} color={T.navy} />
                    </button>
                    <button
                      onClick={() => setBranchToDelete(branch)}
                      className="flex items-center justify-center transition-colors"
                      style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: T.dangerSoft, border: `1px solid ${T.dangerSoft}`, cursor: 'pointer' }}
                    >
                      <Trash2 size={15} color={T.danger} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
                  <div style={{ backgroundColor: T.ivory, borderRadius: '10px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', color: T.muted, marginBottom: '4px' }}>Address</p>
                    <p style={{ fontSize: '13px', color: T.navy }}>{branch.address}</p>
                  </div>
                  <div style={{ backgroundColor: T.ivory, borderRadius: '10px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', color: T.muted, marginBottom: '4px' }}>City & State</p>
                    <p style={{ fontSize: '13px', color: T.navy }}>{branch.city ?? '-'}{branch.state ? `, ${branch.state}` : ''}</p>
                  </div>
                  <div style={{ backgroundColor: T.ivory, borderRadius: '10px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', color: T.muted, marginBottom: '4px' }}>Phone</p>
                    <p style={{ fontSize: '13px', color: T.navy }}>{branch.phone ?? '-'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Branch Form Modal */}
      <BranchFormModal
        isOpen={addBranchOpen || editBranch !== null}
        branch={editBranch}
        onClose={() => { setAddBranchOpen(false); setEditBranch(null); }}
        onSave={handleSaveBranch}
        saving={saving}
      />

      {/* Delete Branch Modal */}
      {branchToDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center p-lg"
          style={{ backgroundColor: 'rgba(4, 9, 30, 0.55)', zIndex: 100 }}
          onClick={() => setBranchToDelete(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '420px', border: `1px solid ${T.ivoryShade}`, boxShadow: '0 24px 60px rgba(4, 9, 30, 0.25)' }}
          >
            <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: `1px solid ${T.ivoryShade}` }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 500, color: T.navy }}>Delete Branch</h2>
              <button
                onClick={() => setBranchToDelete(null)}
                aria-label="Close"
                style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: T.ivory, border: 'none', cursor: 'pointer' }}
              >
                <X size={15} color={T.navy} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '13.5px', color: T.muted, lineHeight: 1.6 }}>
                Are you sure you want to delete the <strong style={{ color: T.navy, fontWeight: 600 }}>{branchToDelete.name}</strong> branch? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-md" style={{ padding: '16px 24px', borderTop: `1px solid ${T.ivoryShade}` }}>
              <button
                onClick={() => setBranchToDelete(null)}
                style={{ fontSize: '13px', fontWeight: 500, color: T.navy, backgroundColor: '#fff', border: `1px solid ${T.ivoryShade}`, borderRadius: '10px', padding: '10px 18px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBranch(branchToDelete)}
                disabled={saving}
                style={{ fontSize: '13px', fontWeight: 600, color: '#fff', backgroundColor: T.danger, border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton Component
function StorePageSkeleton() {
  return (
    <div className="flex flex-col gap-xl animate-pulse" style={{ fontFamily: 'Inter, var(--font-family-sans)' }}>
      <div>
        <div style={{ height: '12px', width: '120px', backgroundColor: T.ivoryShade, borderRadius: '4px', marginBottom: '8px' }} />
        <div style={{ height: '32px', width: '220px', backgroundColor: T.ivoryShade, borderRadius: '6px' }} />
        <div style={{ width: '40px', height: '2px', backgroundColor: T.ivoryShade, marginTop: '12px', marginBottom: '10px' }} />
        <div style={{ height: '14px', width: '280px', backgroundColor: T.ivoryShade, borderRadius: '4px' }} />
      </div>

      <div className="flex gap-xl" style={{ borderBottom: `1px solid ${T.ivoryShade}`, paddingBottom: '12px' }}>
        <div style={{ height: '20px', width: '130px', backgroundColor: T.ivoryShade, borderRadius: '4px' }} />
        <div style={{ height: '20px', width: '100px', backgroundColor: T.ivoryShade, borderRadius: '4px' }} />
      </div>

      <div className="flex flex-col gap-xl max-w-3xl">
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
          <div style={{ height: '18px', width: '120px', backgroundColor: T.ivoryShade, borderRadius: '4px', marginBottom: '18px' }} />
          <div className="flex flex-col gap-lg">
            <div className="flex items-center gap-xl">
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: T.ivoryShade }} />
              <div className="flex flex-col gap-xs">
                <div style={{ height: '14px', width: '100px', backgroundColor: T.ivoryShade, borderRadius: '4px' }} />
                <div style={{ height: '12px', width: '180px', backgroundColor: T.ivoryShade, borderRadius: '4px' }} />
                <div style={{ height: '28px', width: '100px', backgroundColor: T.ivoryShade, borderRadius: '8px', marginTop: '4px' }} />
              </div>
            </div>
            <div>
              <div style={{ height: '112px', borderRadius: '12px', backgroundColor: T.ivoryShade, marginBottom: '8px' }} />
              <div style={{ height: '28px', width: '140px', backgroundColor: T.ivoryShade, borderRadius: '8px' }} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '22px', border: `1px solid ${T.ivoryShade}` }}>
          <div style={{ height: '18px', width: '140px', backgroundColor: T.ivoryShade, borderRadius: '4px', marginBottom: '18px' }} />
          <div className="flex flex-col gap-lg">
            <div style={{ height: '38px', backgroundColor: T.ivoryShade, borderRadius: '10px' }} />
            <div style={{ height: '70px', backgroundColor: T.ivoryShade, borderRadius: '10px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Branch Modal
function BranchFormModal({ isOpen, branch, onClose, onSave, saving }: {
  isOpen: boolean;
  branch: Branch | null;
  onClose: () => void;
  onSave: (b: Partial<Branch>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Branch>>({});

  useEffect(() => {
    if (branch) {
      setForm(branch);
    } else {
      setForm({ name: '', managerName: '', phone: '', whatsapp: '', address: '', city: '', state: '', pincode: '', lat: 0, lng: 0, mapUrl: '' });
    }
  }, [branch, isOpen]);

  function handleSave() {
    if (!form.name || !form.address) return;
    onSave(form);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-lg"
      style={{ backgroundColor: 'rgba(4, 9, 30, 0.55)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${T.ivoryShade}`, boxShadow: '0 24px 60px rgba(4, 9, 30, 0.25)' }}
      >
        <div className="flex items-center justify-between" style={{ padding: '22px 26px', borderBottom: `1px solid ${T.ivoryShade}` }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 500, color: T.navy }}>
            {branch ? 'Edit Branch' : 'Add New Branch'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'flex', items: 'center', justifyContent: 'center', backgroundColor: T.ivory, border: 'none', cursor: 'pointer' }}
          >
            <X size={16} color={T.navy} />
          </button>
        </div>

        <div className="flex flex-col gap-lg" style={{ padding: '22px 26px', fontFamily: 'Inter, var(--font-family-sans)' }}>
          <div className="flex gap-lg flex-col sm:flex-row">
            <Field label="Branch Name *" placeholder="e.g. Connaught Place" value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Field label="Manager Name" placeholder="Manager's full name" value={form.managerName ?? ''} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))} />
          </div>
          <div className="flex gap-lg flex-col sm:flex-row">
            <Field label="Phone" placeholder="+91 XXXXX XXXXX" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Field label="WhatsApp" placeholder="+91 XXXXX XXXXX" value={form.whatsapp ?? ''} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Address *</label>
            <input style={inputStyle} placeholder="Street address" value={form.address ?? ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="flex gap-lg flex-col sm:flex-row">
            <Field label="City" placeholder="City" value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <Field label="State" placeholder="State" value={form.state ?? ''} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            <Field label="Pincode" placeholder="PIN code" value={form.pincode ?? ''} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
          </div>
          <div className="flex gap-lg flex-col sm:flex-row">
            <Field
              label="Latitude"
              placeholder="e.g. 28.6330"
              value={String(form.lat ?? '')}
              onChange={e => setForm(f => ({ ...f, lat: parseFloat(e.target.value) || 0 }))}
            />
            <Field
              label="Longitude"
              placeholder="e.g. 77.2195"
              value={String(form.lng ?? '')}
              onChange={e => setForm(f => ({ ...f, lng: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div className="flex items-start gap-md" style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '16px', border: `1px solid ${T.ivoryShade}` }}>
            <MapPin size={18} color={T.gold} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '12.5px', color: T.muted, lineHeight: 1.55 }}>
              Enter latitude and longitude to enable Google Maps integration. You can find these from Google Maps by right-clicking on the location.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-md" style={{ padding: '18px 26px', borderTop: `1px solid ${T.ivoryShade}` }}>
          <button
            onClick={onClose}
            style={{ fontSize: '13px', fontWeight: 500, color: T.navy, backgroundColor: '#fff', border: `1px solid ${T.ivoryShade}`, borderRadius: '10px', padding: '10px 18px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.address}
            style={{ fontSize: '13px', fontWeight: 600, color: T.gold, backgroundColor: T.navy, border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', opacity: saving || !form.name || !form.address ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Branch'}
          </button>
        </div>
      </div>
    </div>
  );
}