/**
 * Verified contact directory. Approved as already published; unchanged in
 * Stage 2. The action registry may only use email addresses that appear in
 * `channels` (checked by registry.test.ts).
 */
export const contact = {
  channels: [
    {
      label: "Investor relations",
      name: "Investor Relations",
      email: "invest@lifesupply.com",
      phone: "604-677-4146",
    },
    {
      label: "Online sales & product lines",
      name: "Ben Hastibakhsh",
      email: "ben@lifesupply.com",
      phone: "604-551-9538",
    },
    {
      label: "Product showroom & distribution centre",
      name: "Mike Gill",
      email: "mike@dexton.com",
      phone: "604-503-9389",
    },
    {
      label: "Mergers & acquisitions",
      name: "Abdul Ladha",
      email: "abdul@lifesupply.com",
      phone: "604-677-4146",
    },
    { label: "Corporate office", name: "General inquiries", email: "info@lifesupply.com" },
  ],
  subsidiaries: [
    {
      name: "Wellmart Health Supplies Ltd. DBA Lifesupply",
      detail: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
      phone: "1-855-755-5433",
      url: "https://lifesupply.ca",
    },
    {
      name: "MedDirect Distribution Corporation",
      detail: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
      phone: "604-551-9538",
      url: "https://meddirect.ca",
    },
    {
      name: "Dexton Medical Corporation",
      detail: "6911 King George Highway, Surrey, British Columbia V3W 5A1",
      phone: "604-503-9389",
      url: "https://dexton.com",
    },
  ],
} as const;
