import { snapshotsToRemoteRows, mergePassportHistories, syncSummary, type PassportRemoteRow } from '../../account-core.ts';

const rows: PassportRemoteRow[] = snapshotsToRemoteRows([], 'user-id');
const count: number = syncSummary([], []).uploaded;
const moduleId: string | undefined = mergePassportHistories([], [])[0]?.module_id;
void [rows, count, moduleId];

// These are intentional negative fixtures: tsc fails if a contract becomes too broad.
// @ts-expect-error Remote rows require account identity and sync metadata.
const incomplete: PassportRemoteRow = { module_id: 'escape' };
// @ts-expect-error Counts are numeric, not display strings.
const wrongCount: string = syncSummary([], []).downloaded;
void [incomplete, wrongCount];
