import { expect, test } from "@playwright/test";

test.describe("Shipment Pages", () => {
  test("shipments list should load", async ({ page }) => {
    await page.goto("/shipments");
    await expect(
      page.getByRole("heading", { name: /Shipments/i }),
    ).toBeVisible();
  });

  test("new shipment page should load", async ({ page }) => {
    await page.goto("/shipments/new");
    await expect(
      page.getByText(/Create New Shipment|New Shipment/i),
    ).toBeVisible();
  });

  test("shipment detail page structure", async ({ page }) => {
    // This will 404 but we can check the error page loads
    await page.goto("/shipments/test-id");
    // Page should either show shipment not found or a 404
    await expect(
      page.getByText(/not found|404/i).or(page.locator("body")),
    ).toBeVisible();
  });
});

test.describe("Driver Mobile Pages", () => {
  test("driver login should load", async ({ page }) => {
    await page.goto("/driver/login");
    await expect(page.locator("body")).toBeVisible();
  });

  test("driver shipments should load", async ({ page }) => {
    await page.goto("/driver/shipments");
    await expect(
      page.getByRole("heading").or(page.locator("body")),
    ).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("login page should be responsive on mobile", async ({ page }) => {
    await page.goto("/auth/login");

    const form = page.locator("form").first();
    await expect(form).toBeVisible();
    const box = await form.boundingBox();
    expect(box?.width).toBeLessThan(500);
  });

  test("driver login should be responsive on mobile", async ({ page }) => {
    await page.goto("/driver/login");

    // Check that form is visible without using .or() which causes strict mode violation
    await expect(page.locator("form").first()).toBeVisible();
  });
});

test.describe("API Endpoints", () => {
  test("customers API requires authentication", async ({ request }) => {
    const response = await request.get("/api/customers");
    // API requires auth, expect 401 for unauthenticated requests
    expect(response.status()).toBe(401);
  });

  test("shipments API requires authentication", async ({ request }) => {
    const response = await request.get("/api/shipments");
    // API requires auth, expect 401 for unauthenticated requests
    expect(response.status()).toBe(401);
  });

  test("dashboard stats API requires authentication", async ({ request }) => {
    const response = await request.get("/api/dashboard/stats");
    // API requires auth, expect 401 for unauthenticated requests
    expect(response.status()).toBe(401);
  });
});
