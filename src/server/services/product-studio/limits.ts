/**
 * Limits shared by the bulk batch and the unattended run, kept free of
 * imports so a client component (the run form) can read them without
 * pulling the server-side batch module, and with it sharp, into its bundle
 * (2026-10-28).
 */
export const MAX_BATCH_SIZE = 50;
