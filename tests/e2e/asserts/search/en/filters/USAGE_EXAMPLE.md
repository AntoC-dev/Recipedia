# Filter Accordion Assert Files - Usage Guide

## Overview

Accordion asserts are driven by **3 shared generic files** plus one thin
**router file per category**. The router routes to the correct generic based on
the filter `STATE`, passing the category's data (title, item names, item count)
as env vars. This covers all filtering scenarios with no per-category or
per-item duplication.

## Architecture

- **Generic asserts** (shared by every category):
  - `accordions/accordionAll.yaml` - all items visible (expands, asserts each
    item, collapses, guards collapse)
  - `accordions/accordionFiltered.yaml` - only `VISIBLE_ITEMS` visible, every
    other item asserted absent
  - `accordions/accordionHidden.yaml` - accordion not displayed
- **Per-category router**: `accordions/{accordion}.yaml` - routes by `STATE` to
  the generic above, supplying `CATEGORY`, `ITEM_NAMES`, `ITEM_COUNT`, and
  forwarding `VISIBLE_ITEMS`.

The caller maintains `output.accordionIndex` (start at 0, each generic
increments it), so routers are invoked in accordion render order.

## The 3 States

### 1. `STATE="all"` (Default - No Filtering)

All items in the accordion are visible. Default when no filters are applied.

### 2. `STATE="filtered"` (Active Filtering)

Only specific items are visible. List them in `VISIBLE_ITEMS`.

### 3. `STATE="hidden"` (Empty Accordion)

The accordion is not displayed because no items match the current filters.

## Parameters (passed to the router)

- `STATE`: `"all"` (default), `"filtered"`, or `"hidden"`
- `VISIBLE_ITEMS`: Comma-separated list of visible items (only used when
  `STATE="filtered"`)

`CATEGORY`, `ITEM_NAMES`, and `ITEM_COUNT` are baked into each router — callers
never pass them.

## Usage Examples

### Example 1: All Items Visible (No Filter Active)

```yaml
- runFlow:
    file: 'accordions/grainOrCereal.yaml'
    label: 'Assert Cereal accordion with all items visible'
```

Router forwards to `accordionAll.yaml`: asserts the accordion is displayed,
expands it, asserts every item is visible, collapses it, guards the collapse.

### Example 2: Some Items Visible (Filter Active)

```yaml
- runFlow:
    file: 'accordions/grainOrCereal.yaml'
    env:
      STATE: 'filtered'
      VISIBLE_ITEMS: 'Taco Shells,Croutons,Pizza Dough,Pasta'
    label: 'Assert Cereal accordion shows only items matching filter'
```

Router forwards to `accordionFiltered.yaml`: each item in `VISIBLE_ITEMS` is
asserted visible (in render order), every other item asserted absent.

### Example 3: Accordion Hidden (No Matching Items)

```yaml
- runFlow:
    file: 'accordions/grainOrCereal.yaml'
    env:
      STATE: 'hidden'
    label: 'Assert Cereal accordion is not displayed'
```

Router forwards to `accordionHidden.yaml`: asserts the accordion is not
displayed.

### Example 4: Mixed States Across Accordions

```yaml
- evalScript: ${output.accordionIndex = 0}

- runFlow:
    file: 'accordions/grainOrCereal.yaml'
    env:
      STATE: 'filtered'
      VISIBLE_ITEMS: 'Pasta,Croutons'
    label: 'Assert Cereal filtered state'

- runFlow:
    file: 'accordions/vegetable.yaml'
    label: 'Assert Vegetable has all items visible'

- runFlow:
    file: 'accordions/tags.yaml'
    env:
      STATE: 'hidden'
    label: 'Assert Tags accordion is not displayed'
```

## Categories

Each category has a router at `accordions/{accordion}.yaml`:

| Index | Accordion Name             | Router File          |
| ----- | -------------------------- | -------------------- |
| 0     | Cereal                     | grainOrCereal.yaml   |
| 1     | Legumes                    | legumes.yaml         |
| 2     | Vegetable                  | vegetable.yaml       |
| 3     | Plant Protein              | plantProtein.yaml    |
| 4     | Condiment                  | condiment.yaml       |
| 5     | Sauce                      | sauce.yaml           |
| 6     | Meat                       | meat.yaml            |
| 7     | Poultry                    | poultry.yaml         |
| 8     | Fish                       | fish.yaml            |
| 9     | Dairy                      | dairy.yaml           |
| 10    | Cheese                     | cheese.yaml          |
| 11    | Sugar                      | sugar.yaml           |
| 12    | Spice                      | spice.yaml           |
| 13    | Fruit                      | fruit.yaml           |
| 14    | Oil and Fat                | oilAndFat.yaml       |
| 15    | Nuts and Seeds             | nutsAndSeeds.yaml    |
| 16    | Preparation Time           | preparationTime.yaml |
| 17    | Only in-season ingredients | inSeason.yaml        |
| 18    | Tags                       | tags.yaml            |

## Benefits

1. **No Duplication**: 3 generics + one thin router per category replace the old
   per-item leaf files.
2. **Clear Intent**: `STATE` explicitly declares what you're testing.
3. **Easy Maintenance**: Update a category's item list in its router only.
4. **Auto-management**: Expand/collapse and the accordion counter are handled by
   the generics.

## Creating a New Accordion Category

1. Copy `accordions/grainOrCereal.yaml` as a router template.
2. Set `CATEGORY` to the accordion's visible title.
3. Set `ITEM_NAMES` (comma list, render order) and `ITEM_COUNT`.
4. No leaf files needed — the 3 generics do the work.
