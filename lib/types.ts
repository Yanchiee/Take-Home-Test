export type SessionStatus = 'in_progress' | 'submitted' | 'reopened';

export type EventType =
  | 'session_start'
  | 'session_resume'
  | 'idle_start'
  | 'idle_end'
  | 'tab_hidden'
  | 'tab_visible'
  | 'tab_closed'
  | 'paste_detected'
  | 'multi_tab_detected'
  | 'submit'
  | 'admin_reopen'
  | 'links_updated';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  resume_token: string;
  created_at: string;
}

export interface Session {
  id: string;
  candidate_id: string;
  started_at: string;
  submitted_at: string | null;
  active_ms: number;
  last_heartbeat_at: string | null;
  drive_folder_link: string | null;
  video_link: string | null;
  status: SessionStatus;
  updated_at: string;
}

export interface EventRecord {
  id: number;
  session_id: string;
  event_type: EventType;
  occurred_at: string;
  duration_ms: number | null;
  metadata: Record<string, unknown> | null;
}
