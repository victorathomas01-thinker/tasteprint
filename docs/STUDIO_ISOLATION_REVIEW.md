# Studio account isolation and team editing

Genuine backend testing found the team bridge never mounted after the editor's save block changed class. It now attaches to the actual launch block and checks the DOM marker for idempotence, including after editor rerenders. QA/team controls mount once; obsolete operator-credential UI stays hidden. The explicit Workspace demo remains local and cannot publish.

Studio role lookup, hosted reads, saves and publishing are now bound to the initiating account/generation. Auth notifications clear team authority immediately and defer role lookup outside the SDK lock. Same-account token refresh preserves local work. Account changes invalidate late reads/saves; publication receives the same captured actor guard, including after its preceding draft save. Legacy ignored publish-token arguments remain compatible and are never transmitted. Publishing uses the shared bounded transport and does not reveal private backend error bodies.

A teammate editing an existing draft previously supplied their ID as created_by, conflicting with immutable creator enforcement. Upserts now omit that column, allowing its existing Auth default on insert and preserving the original creator on update; updated_by stays bound to the actual initiating user. No backend constraint was weakened or new migration added. The existing Edge publisher already preserves created_by independently and was left unchanged.

Hosted loading uses a validated in-memory editor adapter rather than overwriting local storage to populate the form. Existing saved local drafts take precedence automatically; loading the team version requires explicit local-work confirmation. Startup/response form fingerprints preserve edits made before role recovery or during a download. A successful team save also checks for newer local work before updating a browser copy; local-backup failure is distinct from confirmed server save. Local drafts remain browser-local/device data and are deliberately kept on sign-out; this does not add per-account encrypted local storage.

Verification:

- Actual-source Node probes cover old-actor reads/writes, early typing, saved-local precedence, local edits during upload, preserved token refresh, omitted immutable creator, actor mismatch before dispatch, exact functions/v1/publish-campaign wire endpoint, ignored legacy argument, late publishing acknowledgement and private-error redaction.
- Actual backend-disabled production Studio/demo browser checks cover mounted-once QA/team controls, hidden credential field, local editing, explicit simulated save, disabled publishing and responsive widths.
- Genuine local Auth/PostgREST browser: owner seeds a synthetic draft; an invited editor opens it, edits and saves; database creator remains the owner, updater is the editor, publishing stays disabled for the editor. Existing invitation/revocation/social/reflection/restore/cascade checks remain in the same disposable suite.

No production publishing, hosted Edge execution, email delivery, migration or real data collection. Direct publishing transport tests use controlled synthetic boundaries, not a deployed Edge runtime. Concurrent edits by different teammates remain last-write-wins; this change protects account identity and newer browser work, not server-side optimistic concurrency. Hosted recovery, physical phones and real user usefulness remain unverified.

Validation completed: 39 Node scripts, syntax/build, 15 default browser suites at root/Pages, configured Plans/Friends/shortlists at both bases, and genuine local Auth/social/reflection/Workspace/Studio/restore passed. The new editor adapter additionally rejects invalid catalog/manifest input. No failing check remains. Main stays unchanged and original uncommitted checkout preserved.
