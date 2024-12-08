export const extractMessageFromUnknownError = (
  error: unknown,
): string | undefined =>
  error === undefined || error === null
    ? undefined
    : typeof error === "string"
      ? error !== ""
        ? error
        : undefined
      : typeof error === "object" && error instanceof Error
        ? error.message
        : typeof error === "object"
          ? `Unknown error: ${JSON.stringify(error)}`
          : `Unknown error of type '${typeof error}'`;
