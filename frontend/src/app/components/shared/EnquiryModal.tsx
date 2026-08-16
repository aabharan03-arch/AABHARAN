import { useState } from 'react';
import { Modal, Button, InputField, TextareaField } from '@figma/astraui';
import type { Product } from '../data/mockData';

interface Props {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EnquiryModal({ product, isOpen, onClose }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!form.name || !form.email || !form.phone) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', phone: '', message: '' });
      onClose();
    }, 2000);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={submitted ? 'Enquiry Sent!' : `Enquire about ${product?.name ?? 'this product'}`}
      size="medium"
      footer={
        submitted ? undefined : (
          <>
            <Button variant="neutral" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>Send Enquiry</Button>
          </>
        )
      }
    >
      {submitted ? (
        <div className="flex flex-col items-center gap-lg py-xl text-center">
          <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p className="text-label font-semibold text-text-primary" style={{ fontFamily: 'var(--font-family-sans)' }}>Your enquiry has been sent!</p>
            <p className="text-label-sm text-text-secondary mt-xs" style={{ fontFamily: 'var(--font-family-sans)' }}>The jewellery store will contact you within 24 hours.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-lg">
          {product && (
            <div className="flex items-center gap-md p-md bg-bg-faint rounded-corner-md border border-border-secondary">
              <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
              <div>
                <p className="text-label-sm font-medium text-text-primary" style={{ fontFamily: 'var(--font-family-sans)' }}>{product.name}</p>
                <p className="text-video-title text-text-tertiary" style={{ fontFamily: 'var(--font-family-sans)' }}>{product.storeName} · {product.category}</p>
              </div>
            </div>
          )}
          <InputField
            label="Full Name"
            placeholder="Your full name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
          />
          <InputField
            label="Email Address"
            placeholder="your@email.com"
            value={form.email}
            onChange={v => setForm(f => ({ ...f, email: v }))}
          />
          <InputField
            label="Phone Number"
            placeholder="+91 XXXXX XXXXX"
            value={form.phone}
            onChange={v => setForm(f => ({ ...f, phone: v }))}
          />
          <TextareaField
            label="Message"
            placeholder="Tell the store what you'd like to know about this product..."
            value={form.message}
            onChange={v => setForm(f => ({ ...f, message: v }))}
            rows={3}
          />
        </div>
      )}
    </Modal>
  );
}
