import type { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("Global setup: Ensuring test environment is ready...");

  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3000";

  try {
    const response = await fetch(`${baseURL}/health`);
    if (response.ok) {
      console.log("Server is ready for testing!");
    } else {
      console.warn("Server health check returned:", response.status);
    }
  } catch (_error) {
    console.warn("Could not reach server. Make sure it's running on", baseURL);
  }
}

export default globalSetup;
