import {
  randomOCProperties,
  fullOCProperties,
} from "../../config/characterProperties";

export class InvalidOmittedPropertyError extends Error {}

export function getOmissionChoices(fullSheet: boolean) {
  const properties = fullSheet ? fullOCProperties : randomOCProperties;
  return properties.map(([value, name]) => ({ name, value }));
}

export function parseOmittedProperties(
  value: string | undefined,
  fullSheet: boolean,
) {
  const properties = fullSheet ? fullOCProperties : randomOCProperties;
  const allowed = new Set<string>(properties.map(([name]) => name));
  const requested = (value ?? "")
    .split(",")
    .map((property) =>
      property
        .trim()
        .toLocaleLowerCase()
        .replace(/[\s/-]+/g, "_"),
    )
    .filter(Boolean);
  const invalid = requested.filter((property) => !allowed.has(property));
  if (invalid.length > 0) {
    throw new InvalidOmittedPropertyError(
      `Unknown property to omit: ${invalid.join(", ")}. Valid properties: ${[
        ...allowed,
      ].join(", ")}.`,
    );
  }
  return new Set(requested);
}
