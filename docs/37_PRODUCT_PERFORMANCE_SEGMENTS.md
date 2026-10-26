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
| Top sellers | The 50 products with the most revenue (line subtotal) in the last 90 days, ranked. |
| Promising | Sold at least 2 units in the last 30 days and more than in the 30 days before, or all of its sales are that recent. |
| Cold | Has sold before but nothing in the last 90 days. |
| Non-sellers | Has never sold. |

The figures are computed once per request with four grouped aggregates, so the rows, the total
and every pill count read the same numbers. With a segment active the list shows two extra
columns, units and revenue over the window. Top sellers are at most 50, which fits one page, so
their revenue ordering is a true ordering of the whole segment.

## 3. Phase two: traffic-based segments

"Most abandoned" and "products to improve" compare views and carts against purchases. The
Command Center holds no product-level traffic today: GA4 is connected at site level only, and
BigCommerce's abandoned-cart data is not synced. Phase two extends the GA4 sync to the item-level
report (views, add-to-carts and purchases per item), after which:

- most abandoned = high add-to-cart with low purchases over the window; and
- products to improve = high views with low add-to-cart.

Both will carry their definitions beside the filter in the same way.

## 4. Tests

`performance.test.ts` covers the classification: the top-seller ranking and cap, cold and sold
sets, the promising rule including the two-unit floor, non-sellers as the complement of sold, and
that each segment carries a definition naming its window.
