# TMS Playwright E2E Tests

## Overview

Comprehensive end-to-end test suite for the Transport Management System using Playwright.

## Test Coverage

### Authentication (`auth.spec.ts`)
- Admin login with valid/invalid credentials
- Driver login with phone/PIN
- Access control and redirects
- Session management

### Master Data (`master-data.spec.ts`)
- Customers CRUD
- Vendors CRUD
- Locations CRUD (Warehouse, Port, etc.)
- Schools CRUD
- Vehicles CRUD
- Drivers CRUD
- Goods CRUD

### Shipments (`shipments.spec.ts`)
- Create shipment with single/multi-leg
- View shipment details
- Update shipment status
- Generate BAST PDF with signature
- Driver mobile workflow

## Running Tests

### Install Dependencies
```bash
bun install
bunx playwright install chromium
```

### Run All Tests
```bash
bunx playwright test
```

### Run Specific Test File
```bash
bunx playwright test auth.spec.ts
bunx playwright test master-data.spec.ts
bunx playwright test shipments.spec.ts
```

### Run in UI Mode (Debug)
```bash
bunx playwright test --ui
```

### Run in Headed Mode (See Browser)
```bash
bunx playwright test --headed
```

### Run Specific Project (Browser)
```bash
bunx playwright test --project=chromium
bunx playwright test --project="Mobile Chrome"
```

### Run with Trace Viewer
```bash
bunx playwright test --trace on
bunx playwright show-report
```

## Test Configuration

### Environment Variables
```bash
BASE_URL=http://localhost:3000 bunx playwright test
```

### Test Data
Tests assume the following test data exists:
- Admin user: `admin@example.com` / `password123`
- Driver: `081234567890` / `123456`

### Browser Configuration
Tests run on:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Project Structure

```
e2e/
├── fixtures/
│   └── index.ts          # Page objects and test fixtures
├── tests/
│   ├── auth.spec.ts      # Authentication tests
│   ├── master-data.spec.ts # Master data CRUD tests
│   └── shipments.spec.ts # Shipment workflow tests
└── README.md
```

## Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from "@playwright/test";

test("description", async ({ page }) => {
  await page.goto("/path");
  await page.getByRole("button").click();
  await expect(page).toHaveURL(/expected/);
});
```

### Using Page Objects
```typescript
import { test, expect } from "../fixtures";

test("using fixtures", async ({ loginPage, dashboardPage }) => {
  await loginPage.goto();
  await loginPage.login("admin@example.com", "password");
  await dashboardPage.expectLoaded();
});
```

## CI/CD Integration

Tests automatically run in CI mode when `CI` environment variable is set:
```bash
CI=true bunx playwright test
```

This will:
- Run tests sequentially (workers=1)
- Retry failed tests 2 times
- Generate HTML report

## Debugging

### Screenshots
Screenshots are taken automatically on test failure.

### Traces
Traces are recorded on first retry. View with:
```bash
bunx playwright show-trace trace.zip
```

### VS Code Extension
Install "Playwright Test for VSCode" for:
- Run tests directly from editor
- Debug tests
- Generate tests via recording

## Best Practices

1. **Use semantic selectors**: `getByRole`, `getByLabel`, `getByText`
2. **Avoid hardcoded waits**: Use `expect().toBeVisible()` instead
3. **Keep tests independent**: Each test should set up its own state
4. **Use fixtures**: For common setup/teardown
5. **Mobile testing**: Use `test.use({ viewport: {} })` for mobile tests
