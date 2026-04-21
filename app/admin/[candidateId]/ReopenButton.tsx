'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReopenButton({ candidateId }: { candidateId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function reopen() {
    if (!confirm('Reopen this session? The candidate will be able to continue the test.')) return;
    setLoading(true);
    const res = await fetch('/api/admin/reopen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_id: candidateId }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert('Failed to reopen');
  }

  return (
    <button
      onClick={reopen}
      disabled={loading}
      className="mt-3 rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? 'Reopening…' : 'Reopen for candidate'}
    </button>
  );
}
