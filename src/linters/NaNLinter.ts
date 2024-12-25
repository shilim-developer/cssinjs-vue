import type { Linter } from "./interface";
import { lintWarning } from "./utils";

const linter: Linter = (key, value, info) => {
  if (
    (typeof value === "string" && /NaN/.test(value))
    || Number.isNaN(value)
  ) {
    lintWarning(`Unexpected 'NaN' in property '${key}: ${value}'.`, info);
  }
};

export default linter;
