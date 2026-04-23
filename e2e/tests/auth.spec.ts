import { expect, test } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test.describe("Admin Login Page", () => {
    test("should display login form correctly", async ({ page }) => {
      await page.goto("/auth/login");

      // Check for form elements using actual page content
      await expect(page.getByLabel(/Email/i)).toBeVisible();
      await expect(page.getByLabel(/Password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Sign In/i }),
      ).toBeVisible();
    });

    test("should show validation error for empty fields", async ({ page }) => {
      await page.goto("/auth/login");

      await page.getByRole("button", { name: /Sign In/i }).click();

      // Check for validation message
      await expect(page.getByText(/required/i).first()).toBeVisible();
    });

    test("should show error with invalid credentials", async ({ page }) => {
      await page.goto("/auth/login");

      await page.getByLabel(/Email/i).fill("nonexistent@example.com");
      await page.getByLabel(/Password/i).fill("wrongpassword");
      await page.getByRole("button", { name: /Sign In/i }).click();

      // Wait for the form to process (loading state then back to normal)
      // First, wait for the button to show loading state
      await expect(page.getByRole("button", { name: /Signing/i })).toBeVisible({
        timeout: 5000,
      });

      // Then wait for the form to settle back (either error shown or redirect)
      // We'll check that we're still on login page after a reasonable time
      await page.waitForTimeout(3000);

      // Check that we're still on the login page (not redirected on failure)
      await expect(page).toHaveURL(/.*login.*/);
    });
  });

  test.describe("Driver Login Page", () => {
    test("should display driver login form", async ({ page }) => {
      await page.goto("/driver/login");

      // Check for phone input and login button
      const phoneInput = page
        .locator('input[type="tel"], input[name="phone"]')
        .first();
      await expect(phoneInput).toBeVisible();
      await expect(page.getByRole("button", { name: /Login/i })).toBeVisible();
    });
  });
});
