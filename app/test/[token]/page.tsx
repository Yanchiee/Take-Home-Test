import { supabaseAdmin } from '@/lib/supabase';
import { readFile } from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';
import ActivityTracker from './ActivityTracker';
import Timer from './Timer';
import FinishButton from './FinishModal';
import ResubmitLinksButton from './ResubmitLinksModal';

export const dynamic = 'force-dynamic';

export default async function TestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sb = supabaseAdmin();

  const { data: candidate } = await sb
    .from('candidates')
    .select('id, name')
    .eq('resume_token', token)
    .maybeSingle();
  if (!candidate) notFound();

  const { data: session } = await sb
    .from('sessions')
    .select('id, status, active_ms, started_at, submitted_at, drive_folder_link, video_link, last_heartbeat_at')
    .eq('candidate_id', candidate.id)
    .single();
  if (!session) notFound();

  if (session.last_heartbeat_at && session.status === 'in_progress') {
    const gap = Date.now() - new Date(session.last_heartbeat_at).getTime();
    if (gap > 60_000) {
      await sb.from('events').insert({
        session_id: session.id,
        event_type: 'session_resume',
      });
    }
  }

  const md = await readFile(path.join(process.cwd(), 'content', 'test.md'), 'utf8');
  const submitted = session.status === 'submitted';

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm text-gray-500">Candidate</div>
            <div className="font-medium">{candidate.name}</div>
          </div>
          <Timer
            token={token}
            initialActiveMs={session.active_ms}
            initialStatus={session.status}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {submitted ? (
          <SubmittedView
            submittedAt={session.submitted_at}
            driveLink={session.drive_folder_link}
            token={token}
          />
        ) : (
          <>
            <article className="prose max-w-none">
              <ReactMarkdown>{md}</ReactMarkdown>
            </article>
            <div className="mt-8">
              <FinishButton token={token} />
            </div>
            <ActivityTracker token={token} />
          </>
        )}
      </main>
    </div>
  );
}

function SubmittedView({
  submittedAt,
  driveLink,
  token,
}: {
  submittedAt: string | null;
  driveLink: string | null;
  token: string;
}) {
  return (
    <div className="rounded border border-green-200 bg-green-50 p-6">
      <h2 className="text-lg font-semibold">✓ Submitted</h2>
      {submittedAt && (
        <p className="mt-1 text-sm text-gray-600">
          Submitted at {new Date(submittedAt).toLocaleString()}
        </p>
      )}
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="font-medium">Drive folder</dt>
          <dd>
            {driveLink ? (
              <a href={driveLink} className="text-blue-600 underline" target="_blank">
                {driveLink}
              </a>
            ) : '—'}
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <ResubmitLinksButton
          token={token}
          currentDrive={driveLink ?? ''}
        />
      </div>
    </div>
  );
}
