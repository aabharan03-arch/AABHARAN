import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, GripVertical, Image, FolderPlus, X } from 'lucide-react';
import { Button, Modal, InputField, Badge } from '@figma/astraui';
import { STORES } from '../data/mockData';

interface Collection {
  id: string;
  name: string;
  images: string[];
}

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'c1', name: 'Wedding Collection', images: [STORES[0].gallery[0], STORES[1].gallery[0], STORES[2].gallery[0]] },
  { id: 'c2', name: 'Diamond Collection', images: [STORES[0].gallery[1], STORES[3].gallery[0]] },
  { id: 'c3', name: 'Gold Collection', images: [STORES[0].gallery[2]] },
];

export function GalleryPage() {
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [activeCollection, setActiveCollection] = useState<string>(DEFAULT_COLLECTIONS[0].id);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [deleteCollection, setDeleteCollection] = useState<Collection | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const current = collections.find(c => c.id === activeCollection) ?? collections[0];

  function handleAddCollection() {
    if (!newCollectionName.trim()) return;
    const newCol: Collection = { id: `c${Date.now()}`, name: newCollectionName.trim(), images: [] };
    setCollections(cs => [...cs, newCol]);
    setActiveCollection(newCol.id);
    setNewCollectionName('');
    setNewCollectionOpen(false);
  }

  function handleDeleteImage(colId: string, img: string) {
    setCollections(cs => cs.map(c => c.id === colId ? { ...c, images: c.images.filter(i => i !== img) } : c));
  }

  function handleDeleteCollection(col: Collection) {
    const remaining = collections.filter(c => c.id !== col.id);
    setCollections(remaining);
    if (activeCollection === col.id && remaining.length > 0) setActiveCollection(remaining[0].id);
    setDeleteCollection(null);
  }

  return (
    <div className="flex flex-col gap-xl" style={{ fontFamily: 'var(--font-family-sans)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title text-text-primary">Gallery</h1>
          <p className="text-label-sm text-text-secondary mt-xs">Organise your store images into collections</p>
        </div>
        <Button variant="primary" onClick={() => setNewCollectionOpen(true)} iconStart={<FolderPlus size={16} />}>
          New Collection
        </Button>
      </div>

      <div className="flex gap-xl">
        {/* Collections Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-surface-bg rounded-corner-lg border border-border-secondary overflow-hidden">
            <div className="p-lg border-b border-border-primary">
              <p className="text-label-sm font-semibold text-text-primary">Collections</p>
            </div>
            <div className="flex flex-col">
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => setActiveCollection(col.id)}
                  className={`flex items-center justify-between px-lg py-md text-left transition-colors ${
                    activeCollection === col.id ? 'bg-brand-tertiary' : 'hover:bg-bg-faint'
                  }`}
                >
                  <div className="flex items-center gap-sm min-w-0">
                    <Image size={14} className={activeCollection === col.id ? 'text-[var(--brand-primary)]' : 'text-text-tertiary'} />
                    <div className="min-w-0">
                      <p className={`text-label-sm font-medium truncate ${activeCollection === col.id ? 'text-[var(--brand-primary)]' : 'text-text-primary'}`}>{col.name}</p>
                      <p className="text-video-title text-text-tertiary">{col.images.length} image{col.images.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteCollection(col); }}
                    className="p-xs rounded hover:bg-red-50 transition-colors text-text-tertiary hover:text-danger"
                  >
                    <X size={12} />
                  </button>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 min-w-0">
          {current && (
            <div className="flex flex-col gap-xl">
              <div className="bg-surface-bg rounded-corner-lg p-xl border border-border-secondary flex items-center justify-between">
                <div>
                  <h2 className="text-label font-semibold text-text-primary">{current.name}</h2>
                  <p className="text-label-sm text-text-secondary mt-xs">{current.images.length} image{current.images.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-sm">
                  <Button variant="neutral" size="small" iconStart={<Plus size={14} />}>Upload Images</Button>
                  <Button variant="neutral" size="small" className="text-danger" onClick={() => setDeleteCollection(current)}>Delete Collection</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
                <AnimatePresence>
                  {current.images.map((img, i) => (
                    <motion.div
                      key={img + i}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative rounded-corner-md overflow-hidden border border-border-secondary hover:border-border-selected transition-all"
                      style={{ paddingBottom: '100%' }}
                    >
                      <img
                        src={img}
                        alt={`Gallery image ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightboxImg(img)}
                      />
                      {/* Overlay controls */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-sm opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleDeleteImage(current.id, img)}
                          className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Trash2 size={14} className="text-danger" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors cursor-move">
                          <GripVertical size={14} className="text-text-secondary" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Upload Placeholder */}
                <button className="rounded-corner-md border-2 border-dashed border-border-primary hover:border-border-selected transition-colors flex flex-col items-center justify-center gap-sm text-text-tertiary hover:text-text-secondary bg-bg-faint hover:bg-surface-hover" style={{ paddingBottom: '100%', position: 'relative' }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-sm">
                    <Plus size={24} />
                    <span className="text-video-title">Add Images</span>
                  </div>
                </button>
              </div>

              {current.images.length === 0 && (
                <div className="bg-surface-bg rounded-corner-lg p-2xl text-center border border-border-secondary">
                  <Image size={32} className="text-text-tertiary mx-auto mb-lg" />
                  <p className="text-label font-medium text-text-primary">No images yet</p>
                  <p className="text-label-sm text-text-secondary mt-xs">Upload images to this collection</p>
                  <Button variant="primary" className="mt-xl" iconStart={<Plus size={16} />}>Upload Images</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Collection Modal */}
      <Modal
        isOpen={newCollectionOpen}
        onClose={() => setNewCollectionOpen(false)}
        title="New Collection"
        size="small"
        footer={
          <>
            <Button variant="neutral" onClick={() => setNewCollectionOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddCollection}>Create</Button>
          </>
        }
      >
        <InputField
          label="Collection Name"
          placeholder="e.g. Wedding Collection"
          value={newCollectionName}
          onChange={setNewCollectionName}
        />
      </Modal>

      {/* Delete Collection Modal */}
      <Modal
        isOpen={deleteCollection !== null}
        onClose={() => setDeleteCollection(null)}
        title="Delete Collection"
        size="small"
        footer={
          <>
            <Button variant="neutral" onClick={() => setDeleteCollection(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => deleteCollection && handleDeleteCollection(deleteCollection)} className="bg-danger">Delete</Button>
          </>
        }
      >
        <p className="text-label-sm text-text-secondary">
          Delete <strong className="text-text-primary">{deleteCollection?.name}</strong>? All {deleteCollection?.images.length} images will be removed.
        </p>
      </Modal>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-modal-scrim z-50 flex items-center justify-center p-xl" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Preview" className="max-w-full max-h-full rounded-corner-lg object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute top-xl right-xl w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30" onClick={() => setLightboxImg(null)}>
            <X size={18} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
