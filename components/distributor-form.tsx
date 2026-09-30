'use client';

import { useState, useRef } from 'react';
import { ArrowUpRight, CheckCircle2, MessageCircle } from 'lucide-react';

interface DistributorFormProps {
  onSuccess?: (referenceId: string) => void;
  onClose?: () => void;
  source?: string;
  productContext?: string;
  requirements?: string;
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned);
}

export default function DistributorForm({
  onSuccess,
  onClose,
  source = 'INVolt Website',
  productContext = 'Distributor Network',
  requirements = 'Distributor enquiry',
}: DistributorFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [submittedData, setSubmittedData] = useState<{ name: string; email: string; phone: string } | null>(null);
  const lastSubmitRef = useRef(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting' || status === 'success') return;

    // Client-side duplicate submission prevention (5s cooldown)
    const now = Date.now();
    if (now - lastSubmitRef.current < 5000) {
      setStatus('error');
      setErrorMessage('Please wait a moment before submitting again.');
      return;
    }

    // Client-side validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setStatus('error');
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!trimmedPhone || !isValidPhone(trimmedPhone)) {
      setStatus('error');
      setErrorMessage('Please enter a valid phone number.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    lastSubmitRef.current = now;

    try {
      // POST form data to our server-side API route (avoids CORS)
      const response = await fetch('/api/distributor-enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          source,
          productContext,
          requirements,
        }),
      });

      const data = await response.json() as {
        ok: boolean;
        referenceId?: string;
        error?: string;
      };

      if (data.ok) {
        const newReferenceId = data.referenceId || '';
        setReferenceId(newReferenceId);
        setSubmittedData({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
        });
        setStatus('success');
        if (onSuccess) {
          onSuccess(newReferenceId);
        }
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Unable to send your enquiry. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('A network error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918669668665';
    const whatsappNumber = rawNumber.replace(/[^0-9]/g, '');

    const whatsappMessage = [
      'Hello INVolt,',
      '',
      'I just submitted an enquiry through the INVolt website.',
      '',
      `Reference ID: ${referenceId}`,
      '',
      `Name: ${submittedData?.name || name.trim()}`,
      `Email: ${submittedData?.email || email.trim()}`,
      `Phone: ${submittedData?.phone || phone.trim()}`,
      '',
      `Product/Context: ${productContext}`,
      `Requirements: ${requirements}`,
      '',
      'I would like to follow up regarding my enquiry.',
    ].join('\n');

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="distributor-form-success" role="status" aria-live="polite">
        <div className="distributor-success-icon-wrap">
          <CheckCircle2 size={36} color="#16a34a" />
        </div>
        <h3 className="distributor-success-title">Enquiry Submitted Successfully</h3>
        <p className="distributor-success-text">Your enquiry has been received.</p>
        
        <div className="distributor-reference-card">
          <span className="distributor-reference-label">Reference ID</span>
          <div className="distributor-reference-value">{referenceId}</div>
        </div>

        <div className="distributor-success-actions">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button distributor-whatsapp-btn"
          >
            <MessageCircle size={18} />
            <span>Follow up on WhatsApp</span>
          </a>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="button outline distributor-close-btn"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="distributor-form" onSubmit={handleSubmit} noValidate>
      {status === 'error' && <div className="distributor-form-error">{errorMessage}</div>}
      
      <div className="form-group">
        <label htmlFor="dist_name">Full Name</label>
        <input 
          id="dist_name" 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          required 
          maxLength={100}
          disabled={status === 'submitting'}
          placeholder="Your full name"
          autoComplete="name"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="dist_email">Email Address</label>
        <input 
          id="dist_email" 
          type="email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          required 
          disabled={status === 'submitting'}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="dist_phone">Phone Number</label>
        <input 
          id="dist_phone" 
          type="tel" 
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required 
          disabled={status === 'submitting'}
          placeholder="+91 XXXXX XXXXX"
          autoComplete="tel"
        />
      </div>
      
      <button 
        type="submit" 
        className="button primary" 
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Sending...' : 'Become a Distributor'}
        {status !== 'submitting' && <ArrowUpRight size={19} />}
      </button>
    </form>
  );
}
