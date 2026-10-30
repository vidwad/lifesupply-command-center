# Product performance segments

**Status:** Phase one shipped 2026-10-26 at the product owner's direction. Phase two planned.

**Route:** `/products` ("Performance" filters)

## 1. Purpose

BigCommerce Analytics and Insights lets a merchant filter products as top selling, most abandoned,
products to improve, cold, non-sellers and promising. The Products & Catalog list offers close
equivalents, computed from the order line items the BigCommerce sync already holds, with each
definition stated in words beside the filter. BigCommerce does not publish its own formulas, so
these are equivalents with stated windows, not the same numbers.

## 2. Phase one: sales-based segments

Computed by `src/server/services/products/performance.ts` from `OrderItem` rows joined to their
orders, excluding cancelled and refunded orders. Windows: 90 days overall, 30 days recent.

| Segment | Definition |
| --- | --- |
| Top sellers | The N products with the most revenue (line subtotal) in the last 90 days, ranked. N is the "Top sellers" input on the list, 200 unless changed (product owner, 2026-10-28; it was a fixed 50 before), at most 5,000. |
| Promising | Sold at least 2 units in the last 30 days and more than in the 30 days before, or all of its sales are that recent. |
| Cold | Has sold before but nothing in the last 90 days. |
| Non-sellers | Has never sold. |

The figures are computed once per request with four grouped aggregates, so the rows, the total
and every pill count read the same numbers. With a segment active the list shows two extra
columns, units and revenue over the window. With "Top sellers" active and no column chosen, the
segment is ordered by revenue across all of its pages through the same whole-set revenue ordering
the Revenue column uses, so page two continues the ranking rather than reshuffling a page. The
chosen count travels on the list's links as `top=` only when it differs from the default, so an
address made before the input existed still means what it meant.

### Where the figures come from (October 30, 2026)

The per-product figures are one query over the sold order lines, with each window summed as a filtered aggregate, where there were four queries before. One load serves every reader of the web process for ten minutes; after that the last figures are shown while the next load runs, so no reader waits for the database, and the web process loads them as it starts. The products list derives its header total and every pill count from a single scan of the products under the other filters, judged by the same predicates the rows use, rather than from six separate counts. The list's default order has its own index.

## 3. Phase two: traffic-based segments

"Most abandoned" and "products to improve" compare views and carts against purchases. The
Command Center holds no product-level traffic today: GA4 is connected at site level only, and
BigCommerce's abandoned-cart data is not synced. Phase two extends the GA4 sync to the item-level
report (views, add-to-carts and purchases per item), after which:

- most abandoned = high add-to-cart with low purchases over the window; and
- products to improve = high views with low add-to-cart.

Both will carry their definitions beside the filter in the same way.

## 4. Tests

`performance.test.ts` covers the classification: the top-seller ranking, its default cap of 200
and a chosen cap, the parsing of the count (default for anything that is not a whole number from
1 up, held to the ceiling), the definition stating the chosen count, cold and sold sets, the
promising rule including the two-unit floor, non-sellers as the complement of sold, and that each
segment carries a definition naming its window.
