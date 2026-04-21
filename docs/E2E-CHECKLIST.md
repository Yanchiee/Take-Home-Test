# E2E Walkthrough Checklist

Run this before the first real candidate. Two browsers: one incognito ("candidate"), one normal ("admin").

## Candidate flow
- [ ] Visit `/` — form renders, no test content visible
- [ ] Submit name + email → redirects to `/test/<token>`
- [ ] Test content renders (from `content/test.md`)
- [ ] Timer reads `0h 00m 00s` and starts counting within ~10s
- [ ] Wait 30s; timer shows ~30s
- [ ] Leave tab idle 70s (no mouse/keyboard); timer freezes near 70s
- [ ] Move mouse; timer resumes
- [ ] Switch to another tab for 30s; return — timer continues; dashboard shows `tab_hidden` + `tab_visible`
- [ ] Close the tab; reopen same URL → page loads, timer resumes
- [ ] Paste 100-char string into any field → `paste_detected` event fires
- [ ] Click Finish → modal opens
- [ ] Try to submit without links → validation blocks it
- [ ] Paste two valid https URLs → submit → page flips to Submitted state
- [ ] "Update links" button appears and works
- [ ] Timer is frozen at submission value

## Admin flow
- [ ] Visit `/admin` (logged out) → redirects to `/admin/login`
- [ ] Wrong password → error message
- [ ] After 5 wrong passwords → rate-limited (429)
- [ ] Correct password → `/admin` dashboard
- [ ] Dashboard auto-refreshes every 30s (wait and confirm)
- [ ] Candidate row appears with correct metrics:
  - Active time ≈ observed
  - Elapsed ≥ active
  - Idle pauses = 1
  - Tab switches = 1
  - Pastes = 1
- [ ] Click candidate name → detail page
- [ ] Timeline strip shows colored segments
- [ ] Event log lists all events chronologically
- [ ] Drive and video links are clickable
- [ ] Click Reopen → confirm → status = "reopened"
- [ ] Return to candidate browser, refresh → back in in-progress mode, timer resumed
