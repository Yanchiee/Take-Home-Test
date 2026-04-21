'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResubmitLinksButton({
  token,
  currentDrive,
}: {
  token: string;
  currentDrive: string;
}) {
  const [open, setOpen] = useState(false);
  const [drive, setDrive] = useState(currentDrive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/resubmit-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, drive_folder_link: drive }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Update failed');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-blue-600 underline">
        Update link
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Update submission link</h2>
        <p className="mt-1 text-sm text-gray-600">
          This updates the link shown to the admin. Your timer remains locked.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Drive folder link</span>
            <input
              required
              type="url"
              value={drive}
              onChange={(e) => setDrive(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
