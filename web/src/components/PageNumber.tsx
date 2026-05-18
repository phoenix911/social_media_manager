// Serif oldstyle numeral used in the left rail of editorial rows.
// Renders the index as a magazine-style page number.
// Examples: 01, 02, 0.5, 1.5, 10, 60.
//
// Numbers under 10 are zero-padded to two digits ("01") for visual
// alignment with the rest of the column. Fractional indices keep their
// decimal ("0.5"). >= 10 stay as-is.

export const PageNumber = ({
  n,
  className = "",
}: {
  n: number | string | null | undefined;
  className?: string;
}) => {
  if (n == null) return null;
  let label: string;
  if (typeof n === "string") {
    label = n;
  } else if (Number.isInteger(n) && n >= 0 && n < 10) {
    label = `0${n}`;
  } else if (!Number.isInteger(n)) {
    // Fractional sort-indices (0.5, 1.5).
    label = String(n);
  } else {
    label = String(n);
  }
  return <span className={`serif-numeral tabular ${className}`}>{label}</span>;
};
