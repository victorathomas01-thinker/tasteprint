# Account operation isolation

The legacy optional Passport runtime previously read the mutable global account after awaited requests. A second account could receive the first account's pending merge or have its browser history cleared by an old response.

Operations now capture an actor and generation. Each REST/Edge request checks the current SDK session against that actor and uses its captured bearer token; late responses cannot mutate a different account's local state. Initial recovery cannot overwrite a newer Auth event. Destructive actions invalidate pending merges and wait for an already dispatched sync to settle. Local quizzes completed during upload survive. An explicit deletion reloads after clearing the deleted account's local credential, avoiding a later SDK sign-out that could affect a newly selected account.

Friends, Plans and a connected Together shortlist do not automatically call the independent Passport schema. Explicit Passport sync remains available on its own screen. Shared request deadlines now include session recovery, network work and parsing; a non-abortable Auth promise resolving after the deadline cannot dispatch HTTP.

Regression coverage executes the actual account runtime with synthetic injected browser/Auth/HTTP boundaries: stale initial recovery, account changes during sync/clear/delete, concurrent clear/upload, new quizzes during upload, actionable ownership refusal without backend-body disclosure, Auth and JSON deadlines, and no automatic Passport requests on a Friends route. This is not a hosted provider test. Client-side timeout does not establish rollback of a request already accepted by the server.

No schema changes, production operations, hosted activation or data collection. The separate staging project remains unconfigured. Remaining work includes provider recovery, account-purpose consent/persistent interests, local SDK loading and public-build configuration validation.
