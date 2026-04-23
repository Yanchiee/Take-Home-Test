'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Landing() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong');
      return;
    }
    router.push(`/test/${data.token}`);
  }

  return (
    <div className="grain relative min-h-screen overflow-hidden">
      {/* Background grid — barely visible */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(180,66,36,0.05) 0px, transparent 1px),
            linear-gradient(to bottom, rgba(180,66,36,0.05) 0px, transparent 1px)
          `,
          backgroundSize: '88px 88px',
          backgroundPosition: 'center center',
        }}
      />

      <main className="relative z-10 mx-auto max-w-[640px] px-6 pt-[clamp(48px,10vh,120px)] pb-20 sm:px-8">
        {/* Masthead */}
        <div className="rise rise-1 flex items-center justify-between">
          <div className="flex items-center gap-3 margin-num">
            <span>Arca Academy</span>
            <span style={{ color: 'var(--color-hairline)' }}>✦</span>
            <span>Admissions</span>
          </div>
          <span className="margin-num">MMXXVI</span>
        </div>

        {/* Thin top rule */}
        <div
          className="rise rise-1 mt-4 h-px w-full"
          style={{ background: 'var(--color-hairline)' }}
        />

        {/* Volume / issue label */}
        <div className="rise rise-2 mt-14 margin-num">
          Volume I · Issue № 01 · The Evaluation
        </div>

        {/* Display headline */}
        <h1
          className="rise rise-3 mt-4"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(54px, 10vw, 104px)',
            lineHeight: 0.92,
            letterSpacing: '-0.02em',
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            fontWeight: 400,
            color: 'var(--color-ink)',
          }}
        >
          The Take-Home
          <br />
          <span className="italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
            Test
          </span>
          <span style={{ color: 'var(--color-rust)' }}>.</span>
        </h1>

        {/* Italic subtitle */}
        <p
          className="rise rise-4 mt-8 italic"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(19px, 2.4vw, 23px)',
            lineHeight: 1.45,
            color: 'var(--color-ink-soft)',
            fontVariationSettings: '"opsz" 36, "SOFT" 100',
            maxWidth: '36ch',
          }}
        >
          An invitation to think carefully about a real problem — and to show us how
          you work when no one is rushing you.
        </p>

        {/* Rule ornament */}
        <div className="rise rise-5 mt-12 rule-ornament">
          <span className="mark" />
        </div>

        {/* Body description */}
        <p
          className="rise rise-5 editorial-body mt-12"
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '17px',
            lineHeight: 1.65,
            color: 'var(--color-ink-soft)',
            fontVariationSettings: '"opsz" 14, "SOFT" 20',
          }}
        >
          Your attention to detail matters far more than your speed. We read for
          clarity of thought, precision of craft, and the small considerations that
          distinguish good work from great. Take the time you need to produce
          something you are proud of — then submit it, unhurried, when it is ready.
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} className="rise rise-6 mt-16 space-y-10">
          <div className="editorial-field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
              autoComplete="name"
            />
            <span className="underline-accent" />
          </div>

          <div className="editorial-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              autoComplete="email"
            />
            <span className="underline-accent" />
          </div>

          {error && (
            <p
              style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                color: 'var(--color-rust-deep)',
              }}
            >
              ⚠ {error}
            </p>
          )}

          <div className="pt-4">
            <button type="submit" disabled={loading} className="begin-btn">
              <span>{loading ? 'Preparing your page' : 'Begin the Test'}</span>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </form>

        {/* Footer / colophon */}
        <div
          className="rise rise-7 mt-24 flex items-center justify-between border-t pt-6"
          style={{ borderColor: 'var(--color-hairline)' }}
        >
          <span className="margin-num">Your timer begins upon continuation.</span>
          <span className="margin-num">¶</span>
        </div>
      </main>
    </div>
  );
}
