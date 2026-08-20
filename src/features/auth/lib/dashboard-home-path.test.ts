import { describe, expect, it } from "vitest";
import { dashboardHomePath } from "./dashboard-home-path";

describe("dashboardHomePath", () => {
  it("sends Admin to the admin desk", () => {
    expect(dashboardHomePath("Admin")).toBe("/dashboard/admin");
  });

  it("sends Doctor to the point-of-care desk", () => {
    expect(dashboardHomePath("Doctor")).toBe("/dashboard/doctor");
  });

  it("sends Patient to the citizen dashboard", () => {
    expect(dashboardHomePath("Patient")).toBe("/dashboard");
  });
});
