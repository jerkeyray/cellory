/**
 * Shared formatting utilities used across the application
 */

/**
 * Formats a date to a human-readable string
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "Jan 15, 2024, 10:30 AM")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "5:30")
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Formats a timestamp (seconds) to a time string
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "1:23")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Returns the color class for a marker type
 * @param type - Marker type string
 * @returns Tailwind color classes
 */
export function getMarkerColor(type: string): string {
  if (type.includes("constraint")) return "bg-red-100 text-red-800";
  if (type.includes("strategy") || type.includes("response")) return "bg-blue-100 text-blue-800";
  if (type.includes("control")) return "bg-purple-100 text-purple-800";
  if (type.includes("commitment")) return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
}

/**
 * Returns the hex color for a marker type (for charts)
 * @param type - Marker type string
 * @returns Hex color string
 */
export function getMarkerHexColor(type: string): string {
  if (type.includes("constraint")) return "#ef4444";
  if (type.includes("strategy") || type.includes("response")) return "#3b82f6";
  if (type.includes("control")) return "#8b5cf6";
  if (type.includes("commitment")) return "#10b981";
  return "#6b7280";
}

/**
 * Returns the variant for a status badge
 * @param status - Status string
 * @returns Badge variant
 */
export function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "pending":
      return "secondary";
    case "processing":
    case "extracting":
      return "default";
    case "aggregating":
      return "outline";
    case "ready":
    case "complete":
      return "default";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}

/**
 * Returns the variant for an outcome badge
 * @param outcome - Outcome string ("success" or "failure")
 * @returns Badge variant
 */
export function getOutcomeBadgeVariant(
  outcome: string
): "default" | "destructive" {
  return outcome === "success" ? "default" : "destructive";
}

/**
 * Returns the display text for an outcome
 * @param outcome - Outcome string ("success" or "failure")
 * @returns Display text
 */
export function getOutcomeText(outcome: string): string {
  return outcome === "success" ? "Success" : "Failure";
}

/**
 * Capitalizes the first letter of a string
 * @param str - Input string
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a marker type to human-readable text
 * @param type - Marker type string (e.g., "commitment_request")
 * @returns Formatted text (e.g., "Commitment Request")
 */
export function formatMarkerType(type: string): string {
  return type
    .split("_")
    .map(capitalize)
    .join(" ");
}
