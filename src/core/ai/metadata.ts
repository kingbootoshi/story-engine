export interface AIMetadata {
  module: string;        // REQUIRED – e.g. "world"
  prompt_id: string;     // REQUIRED – e.g. "generate_world_arc_anchors"
  [key: string]: any;    // optional correlation keys
}

export function buildMetadata(
  module: string,
  prompt_id: string,
  extra: Record<string, any> = {}
): AIMetadata {
  return {
    module,
    prompt_id,
    ...extra
  };
}