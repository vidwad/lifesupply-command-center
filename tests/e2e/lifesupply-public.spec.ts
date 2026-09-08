import { expect, test } from "@playwright/test";

test.describe("LifeSupply public site", () => {
  test("renders a corporate homepage with a separate Command Center login boundary", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Health and medical supply infrastructure for a changing market.",
      }),
    ).toBeVisible();

    const dashboardLogin = page.getByRole("link", { name: "Command Center login" }).first();

    const loginHref = await dashboardLogin.getAttribute("href");
    expect(loginHref).toBeTruthy();
    const loginUrl = new URL(loginHref!);

    expect(loginUrl.origin).toBe("https://lifesupply-cc-web.onrender.com");
    expect(loginUrl.pathname).toBe("/login");
    expect(loginUrl.searchParams.get("redirectTo")).toBe("/dashboard");
    await expect(dashboardLogin).not.toHaveAttribute("href", /^\/dashboard/);
  });

  test("keeps principal public corporate routes reachable", async ({ page }) => {
    for (const route of [
      "/about-us",
      "/our-operations",
      "/our-team",
      "/investor-relations",
      "/news",
      "/contact",
    ]) {
      const response = await page.goto(route);
      expect(response?.ok(), `${route} should return a successful response`).toBe(true);
    }
  });
});
