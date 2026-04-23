import { expect, test } from "@playwright/test";

test.describe("Public Pages", () => {
  test("health endpoint should be accessible", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.ok()).toBeTruthy();
  });
});

test.describe("Master Data Pages", () => {
  // Note: These pages currently don't require authentication
  // Update these tests if auth is implemented

  test.describe("Customers Page", () => {
    test("should load customers page", async ({ page }) => {
      await page.goto("/master/customers");
      await expect(
        page.getByRole("heading", { name: /Customers/i }),
      ).toBeVisible();
    });
  });

  test.describe("Vendors Page", () => {
    test("should load vendors page", async ({ page }) => {
      await page.goto("/master/vendors");
      await expect(
        page.getByRole("heading", { name: /Vendors/i }),
      ).toBeVisible();
    });
  });

  test.describe("Schools Page", () => {
    test("should load schools page", async ({ page }) => {
      await page.goto("/master/schools");
      await expect(
        page.getByRole("heading", { name: /Schools/i }),
      ).toBeVisible();
    });
  });

  test.describe("Vehicles Page", () => {
    test("should load vehicles page", async ({ page }) => {
      await page.goto("/master/vehicles");
      await expect(
        page.getByRole("heading", { name: /Vehicles/i }),
      ).toBeVisible();
    });
  });

  test.describe("Drivers Page", () => {
    test("should load drivers page", async ({ page }) => {
      await page.goto("/master/drivers");
      await expect(
        page.getByRole("heading", { name: /Drivers/i }),
      ).toBeVisible();
    });
  });

  test.describe("Goods Page", () => {
    test("should load goods page", async ({ page }) => {
      await page.goto("/master/goods");
      await expect(page.getByRole("heading", { name: /Goods/i })).toBeVisible();
    });
  });
});

test.describe("Dashboard", () => {
  test("should load dashboard page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Dashboard/i }),
    ).toBeVisible();
  });
});

test.describe("Shipments", () => {
  test("should load shipments list", async ({ page }) => {
    await page.goto("/shipments");
    await expect(
      page.getByRole("heading", { name: /Shipments/i }),
    ).toBeVisible();
  });

  test("should load new shipment page", async ({ page }) => {
    await page.goto("/shipments/new");
    await expect(
      page.getByText(/Create New Shipment|New Shipment/i),
    ).toBeVisible();
  });
});
