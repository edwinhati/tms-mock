import { test as base, expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/auth/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/Email or Username/i).fill(email);
    await this.page.getByLabel(/Password/i).fill(password);
    await this.page.getByRole("button", { name: /Sign In/i }).click();
  }

  async expectLoginError() {
    await expect(this.page.getByText(/Invalid|error/i)).toBeVisible();
  }
}

export class DashboardPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(this.page.getByText(/Dashboard/i).first()).toBeVisible();
    await expect(this.page.getByText(/Total Shipments/i)).toBeVisible();
  }

  async navigateToCustomers() {
    await this.page.getByRole("link", { name: /Customers/i }).click();
  }

  async navigateToShipments() {
    await this.page.getByRole("link", { name: /Shipments/i }).click();
  }
}

export class CustomersPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(
      this.page.getByRole("heading", { name: /Customers/i }),
    ).toBeVisible();
  }

  async addCustomer(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
  }) {
    await this.page.getByRole("button", { name: /Add Customer/i }).click();
    await this.page.getByLabel(/Name/i).fill(data.name);
    await this.page.getByLabel(/Email/i).fill(data.email);
    await this.page.getByLabel(/Phone/i).fill(data.phone);
    await this.page.getByLabel(/Address/i).fill(data.address);
    await this.page.getByRole("button", { name: /Create Customer/i }).click();
  }

  async expectCustomerInList(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async deleteCustomer(name: string) {
    const row = this.page.locator("tr", { hasText: name });
    await row.getByRole("button", { name: /Delete/i }).click();
    await this.page.getByRole("button", { name: /Confirm/i }).click();
  }
}

export class ShipmentsPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(
      this.page.getByRole("heading", { name: /Shipments/i }),
    ).toBeVisible();
  }

  async createNewShipment() {
    await this.page.getByRole("button", { name: /New Shipment/i }).click();
  }

  async fillOrderDetails(data: {
    customer: string;
    origin: string;
    destination: string;
  }) {
    await this.page.getByLabel(/Customer/i).click();
    await this.page.getByText(data.customer).click();
    await this.page.getByLabel(/Origin/i).click();
    await this.page.getByText(data.origin).click();
    await this.page.getByLabel(/Destination/i).click();
    await this.page.getByText(data.destination).click();
  }

  async nextStep() {
    await this.page.getByRole("button", { name: /Next/i }).click();
  }

  async submit() {
    await this.page.getByRole("button", { name: /Create Shipment/i }).click();
  }
}

export class DriverLoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/auth/login");
  }

  async login(phone: string, pin: string) {
    await this.page.getByLabel(/Phone/i).fill(phone);
    await this.page.getByLabel(/PIN/i).fill(pin);
    await this.page.getByRole("button", { name: /Login/i }).click();
  }
}

export class DriverShipmentsPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(this.page.getByText(/My Shipments/i)).toBeVisible();
  }

  async openShipment(id: string) {
    await this.page.getByText(id).click();
  }

  async updateStatus(status: string) {
    await this.page.getByRole("button", { name: /Update Status/i }).click();
    await this.page.getByText(status).click();
    await this.page.getByRole("button", { name: /Submit/i }).click();
  }
}

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  customersPage: CustomersPage;
  shipmentsPage: ShipmentsPage;
  driverLoginPage: DriverLoginPage;
  driverShipmentsPage: DriverShipmentsPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  customersPage: async ({ page }, use) => {
    await use(new CustomersPage(page));
  },
  shipmentsPage: async ({ page }, use) => {
    await use(new ShipmentsPage(page));
  },
  driverLoginPage: async ({ page }, use) => {
    await use(new DriverLoginPage(page));
  },
  driverShipmentsPage: async ({ page }, use) => {
    await use(new DriverShipmentsPage(page));
  },
});

export { expect };
