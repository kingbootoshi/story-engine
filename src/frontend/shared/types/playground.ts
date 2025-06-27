/**
 * UI-level helper types used exclusively by the API-Playground page.
 *
 * They are *not* derived from `AppRouter` because the playground is capable of
 * hitting arbitrary REST/tRPC endpoints that are surfaced via the Express
 * bridge's `/meta` route.  Therefore the structure is driven by the dynamic
 * list returned by that endpoint rather than by compile-time types from the
 * backend.
 *
 * Keeping them in a central `types/` folder allows reuse by ancillary
 * components (e.g. a future mobile playground) while clearly separating
 * UI-concerns from domain DTOs.
 */

/**
 * Minimal description of an endpoint shown in the <select> list.
 * – `procedure`   tRPC procedure string (e.g. "world.list")
 * – `type`        whether the call is a query or a mutation
 * – `module`      human-readable name of the module ("worlds")
 * – `params`      optional static hints for default form fields
 */
export interface RouteInfo {
  procedure: string;
  type: 'query' | 'mutation';
  module: string;
  params?: Record<string, unknown>;
}

/**
 * Definition of a dynamically rendered input element used by the playground
 * form.
 *
 * The union of field `type`s is deliberately small – if you introduce another
 * widget (e.g. a file upload) extend this enum and update the form renderer.
 */
export interface FormField {
  /** The name of the JSON property sent to the backend. */
  name: string;
  /** Primitive type selector that dictates which HTML control is shown. */
  type: 'text' | 'number' | 'boolean' | 'object';
  /** Whether the value must be provided before submission. */
  required: boolean;
  /** Current value held in component state (string for simplicity). */
  value: string;
} 