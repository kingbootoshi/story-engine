# AI Prompt Best Practices for Story Engine

This document outlines best practices for writing AI prompts that minimize failures and improve reliability.

## Key Principles

### 1. **Always Provide Concrete Examples**
The single most effective way to reduce AI failures is to show the exact JSON structure you expect:

```typescript
// BAD - Just describing the format
"Return a JSON object with name, description, and tags fields"

// GOOD - Showing exact structure
EXAMPLE OUTPUT:
{
  "name": "The Shattered Coast",
  "description": "A treacherous coastline where...",
  "tags": ["coastal", "stormy", "fishing"],
  "relative_position": { "x": 15, "y": 40 }
}
```

### 2. **Use Visual Formatting for Requirements**
Make requirements scannable with checkmarks and X marks:

```typescript
FORMAT REQUIREMENTS:
✓ Generate 2-4 regions total
✓ Each region MUST have: name, description, tags (array), relative_position (with x,y)
✓ Coordinates: Numbers between 0-100

COMMON MISTAKES TO AVOID:
✗ Don't put tags inside the description text
✗ Don't use strings for coordinates (use numbers: 50 not "50")
```

### 3. **Structure Prompts in Clear Sections**
Break prompts into logical sections rather than walls of text:

```typescript
// System prompt structure
1. Role and expertise statement
2. CRITICAL: JSON example
3. Validation rules
4. Common mistakes to avoid

// User prompt structure  
1. Context (world, current state)
2. Specific task
3. Constraints/requirements
4. Reminder to follow example
```

### 4. **Be Explicit About Data Types**
Common type confusion that causes failures:

```typescript
// Specify exact types
✓ numbers: 50 (not "50")
✓ arrays: ["tag1", "tag2"] (not "tag1, tag2")
✓ null: null (not "null" or "none")
✓ booleans: true/false (not "true"/"false")
```

### 5. **Provide Bounded Options**
When possible, list valid values:

```typescript
✓ Story roles: 'major' | 'minor' | 'wildcard' | 'background'
✓ Status: 'thriving' | 'stable' | 'declining' | 'ruined' | 'abandoned' | 'lost'
✓ Impact: 'minor' | 'moderate' | 'major'
```

### 6. **Include Cardinality Constraints**
Be specific about how many items to generate:

```typescript
✓ "Generate exactly 3 anchors"  
✗ "Generate some anchors"

✓ "Create 2-4 regions"
✗ "Create multiple regions"
```

### 7. **Address Edge Cases**
Explicitly handle optional fields and edge cases:

```typescript
// Clear about what's optional
"newStatus is optional - only include if status changes"
"descriptionAppend is optional - only for significant new details"
"Return an empty updates array if no locations are affected"
```

## Recent Improvements Summary

### 1. **Region Generation** (`regionGeneration.prompts.ts`)
- Added full JSON example with two complete regions
- Moved format requirements to the top with checkmarks
- Listed common mistakes explicitly
- Clarified coordinate types (numbers not strings)

### 2. **Character Generation** (`generateCharacters.prompts.ts`)
- Added example showing exact field structure
- Clarified faction_id handling (null in output)
- Specified trait/motivation counts
- Better role distribution guidance

### 3. **World Arc Anchors** (`anchor.prompts.ts`)
- Full example with all three required anchors
- Emphasized exact beat indices (0, 7, 14)
- Showed complete structure for each beat
- Added validation requirements section

### 4. **Faction Generation** (`generateFaction.prompts.ts`)
- Complete example with all fields
- Listed valid tag categories
- Specified member count format (powers of 10)
- Common mistakes section

### 5. **Location Mutations** (`locationMutation.prompts.ts`)
- Example showing UUID usage
- Clarified optional vs required fields
- Status progression rules with checkmarks
- Clear instructions for empty results

### 6. **Character Beat Evaluation** (`evaluateBeat.prompts.ts`)
- Comprehensive example with all response fields
- Importance scale with specific ranges
- Condensed character display format
- Clear guidelines for each field

## Testing Prompt Improvements

When updating prompts, test with:

1. **Minimal Input**: Does it work with bare minimum context?
2. **Edge Cases**: Empty arrays, null values, no affected entities
3. **Complex Scenarios**: Multiple updates, all fields populated
4. **Invalid Context**: Missing locations/factions referenced

## Monitoring and Iteration

1. **Log Failed Responses**: Capture actual AI outputs that fail validation
2. **Identify Patterns**: Common fields that are misformatted
3. **Update Examples**: Add examples that address failure patterns
4. **Test Improvements**: Verify changes reduce failure rate

## Prompt Maintenance Checklist

When creating or updating prompts:

- [ ] Include at least one complete JSON example
- [ ] List all required and optional fields
- [ ] Specify exact data types for each field
- [ ] Add "Common Mistakes" section if applicable
- [ ] Use visual formatting (✓/✗) for rules
- [ ] Test with both simple and complex inputs
- [ ] Verify schema matches expected structure
- [ ] Keep system prompt under 1000 tokens when possible 