# 42 — Order KPI audit against BigCommerce

**Document status:** Audit record and standing method
**Prepared:** November 3, 2026
**Trigger:** The owner found a LifeSupply.ca customer showing two cancelled, payment-failed orders of $22,999,000 and $25,298,900 and asked that order statistics stop counting failed transactions, then asked for the calculated performance KPIs to be audited against what BigCommerce shows so that neither the calculations nor the dataset carry errors.
**Audience:** Product owner, developers, anyone reading an order-derived figure in the Command Center.

---

## 1. Summary

Every order-derived figure in the Command Center was built on a different rule about which orders count, and the most visible one, customer lifetime value, had no rule at all. The audit found six defects and three open decisions. The defects are fixed in the change that accompanies this document; the decisions are listed in §7 for the owner.

| # | Finding | Severity | State |
| --- | --- | --- | --- |
| F-1 | Customer lifetime value and order count counted every order, including cancelled, declined and refunded ones. Stored lifetime value across registered customers was $69.3M; the orders that actually went through total $16.8M. | High | Fixed |
| F-2 | Customer lifetime figures were last computed on May 14, 2026, while orders kept syncing through October 30. 5,929 customers showed less lifetime value than even their raw order total. | High | Fixed |
| F-3 | An incremental customer sync overwrote lifetime figures with only the recently modified orders' spend. | High | Fixed |
| F-4 | Guest customers (272 rows, $460,559 of real sales) had lifetime value of zero because no process computed it. | Medium | Fixed |
| F-5 | Sales Intelligence counted BigCommerce "Incomplete" checkouts whose card was declined as revenue: 1,005 orders, $531,775 lifetime, including $163,473 of September 2026's reported $294,016. | High | Fixed |
| F-6 | The BigCommerce reconciliation compared only raw totals, so it could never show whether the Command Center's sales figures agree with BigCommerce's. It had also never been run: the report table is empty. | Medium | Fixed (new rows); first run is the owner's |
| D-1 | The Executive Dashboard's product leaderboard excludes only `cancelled`, so it still counts refunded orders and declined checkouts. Recorded in `docs/36` §7.1 as an owner decision. | Decision | Open |
| D-2 | BigCommerce "Incomplete" orders whose payment was not declined (47 orders, $18,100) still count as sales because they map to `received` + `pending`. | Decision | Open |
| D-3 | Eight customers with `sourceSystem = "seed"` exist in production with $141,373 of stored lifetime value and $2,373 of real orders. | Decision | Open |

The BigCommerce-side comparison could not be performed from the audit machine: the store credentials live only in the production credential vault, and this repository holds none. Section 6 describes how the owner runs that comparison from the Admin area in a few minutes, and what result confirms the figures.

---

## 2. Method and limits

- **Command Center data** was read from the production Postgres database on November 3, 2026 through Render's read-only query path. Every figure below comes from those queries unless stated otherwise.
- **BigCommerce data** was not queried. The `metadata.bcRaw` copy of each synced order header (its BigCommerce `status` and `payment_status` strings) stands in for it where the mapping is examined.
- **Rules** were read from the code as merged at `91c4c93` (main, November 3, 2026) before this change.
- Figures are in the store's reporting currency as stored; no currency conversion is applied.

---

## 3. How BigCommerce statuses reach the Command Center

The order sync maps each BigCommerce `status_id` to an order status and a payment status, then lets `payment_status` and `refunded_amount` override the payment. The audit cross-checked that mapping against production (`metadata.bcRaw.status` versus the stored status):

| BigCommerce status | Orders | Total | Command Center order / payment | Counts as a sale now |
| --- | ---: | ---: | --- | --- |
| Shipped | 68,802 | $14,635,600 | shipped / paid | Yes |
| Refunded | 9,491 | $2,618,845 | refunded / refunded | No |
| Awaiting Pickup | 4,426 | $976,312 | processing / paid | Yes |
| Partially Shipped | 3,893 | $1,091,974 | processing / paid | Yes |
| Cancelled | 3,517 | $52,258,224 | cancelled / failed | No |
| Completed | 2,586 | $705,726 | completed / paid | Yes |
| Partially Refunded | 1,334 | $390,335 | processing / partially_refunded | Yes, at gross |
| Incomplete | 1,052 | $549,874 | received / pending, or received / failed when the card was declined | Only when not declined (see D-2) |
| Awaiting Fulfillment | 190 | $43,205 | processing / paid | Yes |
| Awaiting Shipment | 125 | $41,983 | processing / paid | Yes |
| Declined | 125 | $624,165 | cancelled / failed | No |
| Disputed | 116 | $25,022 | awaiting_human_review / failed | No |
| Awaiting Payment | 22 | $7,569 | received / pending | Yes |
| Manual Verification Required | 2 | $1,138 | awaiting_human_review / pending | Yes |

The mapping itself is sound: no BigCommerce status lands on a Command Center status that misdescribes it. The defects were all downstream, in which statuses each figure chose to count.

The two orders that prompted this audit are BigCommerce orders 76504 ($25,298,900) and 76507 ($22,999,000), both dated November 8, 2021, both "Cancelled" in BigCommerce with no payment status. They are test or mistaken orders that BigCommerce correctly shows as cancelled. Order 40938 ($1,508,013, January 2020) and 54145 ($101,689, August 2020) are the same kind. The Command Center stored them faithfully; it should never have added them up.

---

## 4. The rules in force before this change

| Figure | Where | Rule before | Effect in production |
| --- | --- | --- | --- |
| Customer lifetime value, order count, first and last order | Customer detail, customers list, reactivation scoring, marketing segments, campaign streams | Every BigCommerce order for the customer, any status (customer sync's own order walk) | $69.3M stored against $16.8M of real sales (F-1) |
| Customer CSV export: Total Lifetime Spend, AOV, Largest Single Order | Automation Center export | Same walk, same rule | Same inflation, plus a cancelled $25M "largest order" |
| Sales Intelligence revenue, order count, AOV, units, margin | `getSalesOverview` and the per-product figures | Order status not `cancelled` or `refunded`; payment status ignored | Declined checkouts counted (F-5) |
| Executive Dashboard product leaderboard | Dashboard | Order status not `cancelled` | Refunded orders and declined checkouts counted (D-1) |
| Executive Dashboard revenue KPI | Dashboard | QuickBooks financial summaries, not orders | Not affected by any of this |
| BigCommerce reconciliation | Admin → Reconciliation | Raw sums of every order on both sides | Correct as a completeness check, blind to sales agreement (F-6) |

### 4.1 Lifetime totals under each rule

| Store | Orders | Raw total | Dashboard rule (not cancelled) | Sales Intelligence rule before (not cancelled or refunded) | Sale rule now | Refunds recorded |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LifeSupply.ca | 94,620 | $73,840,287 | $20,966,678 | $18,366,335 | $17,770,116 | $2,669,061 |
| WellmartMedical.com | 1,073 | $132,110 | $123,279 | $104,777 | $101,883 | $8,398 |

### 4.2 Recent months under each rule

| Month | Orders | Sale orders | Raw total | Dashboard rule | Sales Intelligence rule before | Sale rule now |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| July 2026 | 790 | 493 | $187,672 | $165,740 | $154,847 | $127,450 |
| August 2026 | 701 | 478 | $193,594 | $173,560 | $161,803 | $124,046 |
| September 2026 | 793 | 492 | $368,515 | $304,633 | $294,016 | $130,544 |
| October 2026 | 652 | 538 | $205,766 | $186,771 | $184,884 | $151,213 |

September is the clearest case. Of the $294,016 the Sales Intelligence rule reported, $163,473 was 136 "Incomplete" checkouts whose card was declined, and $61,514 was 126 cancelled orders. Real sales were $130,544.

### 4.3 Customer aggregates against the Order table

| Customer source | Customers with orders | Stored lifetime value | Raw order total | Sale-rule total | Customers whose stored value differs from the sale-rule total |
| --- | ---: | ---: | ---: | ---: | ---: |
| BigCommerce registered | 55,114 | $69,313,011 | $71,818,456 | $16,839,006 | 15,595 |
| BigCommerce guest | 272 | $0 | $1,172,832 | $460,559 | 195 |
| Seed | 8 | $141,373 | $2,423 | $2,373 | 8 |

The stored registered total sits close to the raw total, which confirms the old walk counted everything. The gap between them is staleness: the last customer sync wrote its `bcSyncedAt` on May 14, 2026, orders are current to October 30, and 5,929 customers have a stored value below even their raw order total.

The customer in the owner's screenshot has two orders, both cancelled with failed payment, and a stored lifetime value of $48,297,900. Under the sale rule the account has no orders and no lifetime value, which is what BigCommerce shows for it.

---

## 5. What changed

One rule now answers "does this order count?" everywhere, and the customer figures are derived from the Order table rather than from a separate walk.

1. **`src/server/services/orders/sale-rule.ts`** holds the rule: an order counts unless its status is `cancelled` or `refunded`, or its payment status is `failed` or `refunded`. Pending payment counts, partial refunds count at gross. It exports the predicate, the status lists and the equivalent Prisma filter, and its test pins every enum value to a decision.
2. **Customer lifetime figures** (`src/server/services/customers/lifetime-metrics.ts`) are recomputed from the Order table under that rule by one grouped statement that touches only the customers whose figures change. The order sync runs it at the end of every full and incremental walk, so the figures stay current and guests get them. `pnpm customers:recompute` runs it by hand.
3. **The customer sync's own walk** now skips non-sale orders (reported as `ordersExcluded`), and an incremental run preserves existing customers' figures instead of overwriting them with a partial walk.
4. **The customer CSV export** skips non-sale orders, so Total Lifetime Spend, AOV and Largest Single Order agree with the pages.
5. **Sales Intelligence** applies the rule through its policy module, so a declined checkout is no longer revenue. The dashboard leaderboard is unchanged (D-1).
6. **The reconciliation** gains two rows, "Sales (range)" and "Sales revenue (range)", computed under the rule on both sides: the BigCommerce side derives each header's status exactly as the order sync would. The raw rows remain as the completeness check.
7. **The customer page** says under Lifetime metrics that cancelled, declined and refunded orders are left out, since the recent-orders table above it still lists them.

### 5.1 Figures the change produces

Recomputed from production's Order table on November 3, 2026, as the first order sync after deployment will write them:

| Figure | Before | After |
| --- | ---: | ---: |
| Registered customers' lifetime value, total | $69,313,011 | $16,839,006 |
| Guest customers' lifetime value, total | $0 | $460,559 |
| Customers whose figures change on the first recompute | | about 15,800 |
| September 2026 Sales Intelligence revenue | $294,016 | $130,544 |
| Screenshot customer's lifetime value / order count | $48,297,900 / 2 | $0 / 0 |

---

## 6. Running the comparison against BigCommerce

This is the part of the audit the owner completes, because only production can reach the store.

1. Deploy this change and run **Automation Center → BigCommerce → Orders → Incremental sync** for each store. The end of the run recomputes every customer's lifetime figures; the sync log's metadata records `customersRecomputed`.
2. Open **Admin → Reconciliation** and run it for each store over a closed month, for example September 1 to September 30, 2026.
3. In BigCommerce, open **Orders** for the same store and date range and note the order count and total with the default view (which hides incomplete orders), then **Analytics → Sales** or the Orders report for the same range.
4. Compare:
   - **"Orders (range)" and "Revenue (range)"** must match BigCommerce's own raw totals within tolerance. A gap here means orders are missing or duplicated in the Command Center, which is a dataset problem, not a rule problem.
   - **"Sales (range)" and "Sales revenue (range)"** are the Command Center's figures under the sale rule, and the reconciliation shows BigCommerce's headers under the same rule beside them. These two columns must agree exactly, because both sides apply one function to the same headers; a gap means the stored status of some order no longer matches BigCommerce's.
   - Then hold the sale-revenue figure against the BigCommerce report. Where BigCommerce's report leaves out cancelled, declined and refunded orders it will match; where it also leaves out incomplete orders, D-2 explains the remaining difference; where it reports something else, the difference is BigCommerce's own definition and should be recorded here with the figure.
5. Record the run's report id, the four pairs and the BigCommerce figures in §8.

A material gap raises an Exception keyed `reconciliation:<storeId>:<metric>`, so a recurring difference groups rather than floods.

---

## 7. Open decisions for the owner

**D-1. The Executive Dashboard's product leaderboard.** It excludes only cancelled orders and so counts refunded orders and declined checkouts. `docs/36` §7.1 recorded the refund half of this as a decision the owner makes rather than a side effect of another change; the declined-checkout half is new. Moving it to the sale rule is a one-line change once decided. The dashboard's revenue KPI comes from QuickBooks summaries and is not affected either way.

**D-2. BigCommerce "Incomplete" orders.** An incomplete order is a checkout that never finished. The sync maps it to `received` with a pending payment, so the 47 that were not declined ($18,100 lifetime, $8,426 in September) count as sales in flight. BigCommerce's own order list hides them by default. The recommendation is to map `status_id 0` to a status the sale rule excludes, which also removes them from the open-orders count. That is a mapping change with its own test, not part of this fix.

**D-3. Seed customers in production.** Eight customers carry `sourceSystem = "seed"` with $141,373 of stored lifetime value and $2,373 of linked orders. They look like demonstration rows from the seed script. If so they should be deleted from production, or at least excluded from the customers list and marketing segments; the recompute will reduce their stored value to the linked orders in the meantime.

---

## 8. Reconciliation runs recorded

| Date | Store | Range | Report id | Orders (CC / BC) | Revenue (CC / BC) | Sales (CC / BC) | Sales revenue (CC / BC) | BigCommerce report figure | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | | | Not yet run |

---

## 9. Relationship to Phase 11

This change is read-side and sync-side only. It writes nothing to BigCommerce, QuickBooks or Mailchimp, enables no feature flag, adds no schema or migration, and changes no launch gate in `docs/20` §5. It widens the reconciliation evidence that Phase 11D relies on by making the comparison meaningful.
