import { describe, expect, it } from "vitest";

import {
  countActiveFilters,
  readLeadFilters,
  writeLeadFilters,
} from "./lead-filters";

describe("lead filter URL state", () => {
  it("reads supported values and ignores unsupported enum values", () => {
    const filters = readLeadFilters(
      new URLSearchParams(
        "search=Ali&lead_source=warm&responsible=hacker&deal_stage=qualified&technical_spec_requested=true",
      ),
    );
    expect(filters).toMatchObject({
      search: "Ali",
      lead_source: "warm",
      responsible: "",
      deal_stage: "qualified",
      technical_spec_requested: "true",
    });
    expect(countActiveFilters(filters)).toBe(4);
  });

  it("writes non-default filters and pagination", () => {
    const filters = readLeadFilters(new URLSearchParams());
    filters.search = "99890";
    filters.order = "asc";
    expect(writeLeadFilters(filters, 2).toString()).toBe(
      "search=99890&order=asc&page=2",
    );
  });
});
