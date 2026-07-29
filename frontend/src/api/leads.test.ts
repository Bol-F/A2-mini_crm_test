import { describe, expect, it } from "vitest";

import { buildLeadQuery } from "./leads";
import { DEFAULT_LEAD_FILTERS } from "../lib/lead-filters";

describe("lead API query", () => {
  it("builds encoded filtering, sorting, and pagination parameters", () => {
    const query = new URLSearchParams(
      buildLeadQuery(
        {
          ...DEFAULT_LEAD_FILTERS,
          search: "Ali +998",
          lead_source: "warm",
          technical_spec_requested: "true",
          sort: "client_name",
          order: "asc",
        },
        3,
      ),
    );
    expect(Object.fromEntries(query)).toMatchObject({
      search: "Ali +998",
      lead_source: "warm",
      technical_spec_requested: "true",
      sort: "client_name",
      order: "asc",
      page: "3",
      page_size: "20",
    });
  });
});
