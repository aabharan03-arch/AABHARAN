'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Layers, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search
} from 'lucide-react';

interface MetalType {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const CACHE_KEY = 'storeadmin_metaltypes_cache';
const CACHE_TIME_KEY = 'storeadmin_metaltypes_cache_time';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 Minutes Cache

export default function MetalTypesPage() {
  const [metalTypes, setMetalTypes] = useState<MetalType[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMetalType, setEditingMetalType] = useState<MetalType | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [metalTypeToDelete, setMetalTypeToDelete] = useState<MetalType | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('storeadmin_token');
    }
    return null;
  };

  // Save to Cache Helper
  const saveToCache = (data: MetalType[]) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    }
  };

  // Fetch Metal Types with Cache Handling
  const fetchMetalTypes = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Check Local Storage Cache First
    if (!forceRefresh && typeof window !== 'undefined') {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);

      if (cachedData && cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < CACHE_DURATION_MS) {
          setMetalTypes(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }
    }

    try {
      const token = getAuthToken();
      const res = await fetch('/api/storeadmin/metal-types', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response. Please check your session.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch metal types');

      const fetchedMetalTypes = data.metalTypes || [];
      setMetalTypes(fetchedMetalTypes);
      saveToCache(fetchedMetalTypes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetalTypes();
  }, [fetchMetalTypes]);

  // Derived memoized metal types list
  const filteredMetalTypes = useMemo(() => {
    if (!searchQuery.trim()) return metalTypes;
    const query = searchQuery.toLowerCase();
    return metalTypes.filter(
      (metal) =>
        metal.name.toLowerCase().includes(query) ||
        (metal.description && metal.description.toLowerCase().includes(query))
    );
  }, [metalTypes, searchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingMetalType(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (metalType: MetalType) => {
    setEditingMetalType(metalType);
    setFormData({
      name: metalType.name,
      description: metalType.description || '',
    });
    setIsModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (metalType: MetalType) => {
    setMetalTypeToDelete(metalType);
    setIsDeleteModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const token = getAuthToken();
    const isEdit = !!editingMetalType;
    const url = isEdit 
      ? `/api/storeadmin/metal-types/${editingMetalType.id}` 
      : '/api/storeadmin/metal-types';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      let updatedMetalTypes: MetalType[];
      if (isEdit) {
        updatedMetalTypes = metalTypes.map((metal) =>
          metal.id === editingMetalType.id ? data.metalType : metal
        );
      } else {
        updatedMetalTypes = [data.metalType, ...metalTypes];
      }

      setMetalTypes(updatedMetalTypes);
      saveToCache(updatedMetalTypes);

      setIsModalOpen(false);
      showToast(
        isEdit ? 'Metal type updated successfully!' : 'Metal type created successfully!',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Metal Type
  const confirmDeleteMetalType = async () => {
    if (!metalTypeToDelete) return;
    setDeleting(true);

    const token = getAuthToken();
    try {
      const res = await fetch(`/api/storeadmin/metal-types/${metalTypeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete metal type');

      const updatedMetalTypes = metalTypes.filter((metal) => metal.id !== metalTypeToDelete.id);
      setMetalTypes(updatedMetalTypes);
      saveToCache(updatedMetalTypes);

      setIsDeleteModalOpen(false);
      setMetalTypeToDelete(null);
      showToast('Metal type deleted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete metal type', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF8F5] text-[#1A1A1A] font-sans relative">
      
      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="fixed top-5 right-5 z-[60] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-[#121625] text-white border-amber-500/30'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <CheckCircle2 size={20} className="text-amber-400 shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-red-300 shrink-0" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* FIXED / STICKY HEADER */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/80 backdrop-blur-md border-b border-amber-900/5 px-10 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div>
          <h1 className="text-3xl font-serif text-[#121625] font-normal">Metal Types</h1>
          <div className="w-12 h-0.5 bg-amber-600/40 mt-1"></div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter metal types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 w-48 md:w-60 transition-all"
            />
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#121625] hover:bg-[#1a2035] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md shrink-0"
          >
            <Plus size={16} />
            Add Metal Type
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <section className="px-10 py-6 flex-1">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* SKELETON LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white/60 border border-slate-200/60 rounded-2xl p-6 animate-pulse flex flex-col justify-between h-[180px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-slate-200 rounded-lg"></div>
                      <div className="w-6 h-6 bg-slate-200 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-slate-200 rounded-md w-1/2 mb-3"></div>
                  <div className="h-3 bg-slate-200 rounded-md w-3/4 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between">
                  <div className="h-3 bg-slate-200 rounded-md w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMetalTypes.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white rounded-2xl border border-amber-900/10 p-12 text-center shadow-sm max-w-2xl mx-auto mt-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-serif text-[#121625] mb-1">
              {searchQuery ? 'No metal types found' : 'No metal types yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery
                ? `No result matching "${searchQuery}". Try clearing your search filter.`
                : 'Get started by creating your first metal type (e.g., Gold, Silver, Platinum).'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-amber-800 font-medium text-sm hover:underline"
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#121625] text-white px-5 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 shadow-sm"
              >
                <Plus size={16} /> Create Metal Type
              </button>
            )}
          </div>
        ) : (
          /* METAL TYPES GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMetalTypes.map((metal) => (
              <div
                key={metal.id}
                className="bg-white border border-amber-900/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-amber-50/80 rounded-xl text-amber-800">
                      <Layers size={20} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(metal)}
                        className="p-1.5 text-slate-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(metal)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-serif text-lg text-[#121625] font-medium mb-1">
                    {metal.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                    {metal.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Added {new Date(metal.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-amber-900/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-serif text-lg text-[#121625]">
                {editingMetalType ? 'Edit Metal Type' : 'Add New Metal Type'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">
                  Metal Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold, Silver, Platinum"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of this metal type..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#121625] hover:bg-[#1a2035] text-white px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingMetalType ? 'Save Changes' : 'Create Metal Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && metalTypeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-amber-900/10 overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="font-serif text-lg text-[#121625] mb-2 font-medium">
              Delete Metal Type?
            </h3>
            
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{metalTypeToDelete.name}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMetalTypeToDelete(null);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteMetalType}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}