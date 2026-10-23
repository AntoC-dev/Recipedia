# Issues

Every issue goes on the [Recipedia project](https://github.com/users/AntoC-dev/projects/3) with its **Category** and
**Priority** fields set — the board's columns come from them. Labels do NOT fill these fields.

Type label → Category:

| Label           | Category      |
|-----------------|---------------|
| `bug`           | Bug           |
| `enhancement`   | Feature       |
| `refactor`      | Refactor      |
| `test`          | Test          |
| `exploration`   | Exploration   |
| `ci`            | CI            |
| `dependencies`  | Dependencies  |
| `documentation` | Documentation |

Priority label → Priority: `p0-critical` → P0, `p1-high` → P1, `p2-medium` → P2.

After creating an issue (with its type and priority labels), set both fields:

```bash
url=$(gh issue create --repo AntoC-dev/Recipedia --title "..." --body "..." --label bug --label p2-medium)
item=$(gh project item-add 3 --owner AntoC-dev --url "$url" --format json --jq .id)
fields=$(gh project field-list 3 --owner AntoC-dev --format json)
set_field() { # $1 = field name, $2 = option name
  local field option
  field=$(jq -r --arg f "$1" '.fields[] | select(.name==$f) | .id' <<<"$fields")
  option=$(jq -r --arg f "$1" --arg o "$2" '.fields[] | select(.name==$f) | .options[] | select(.name==$o) | .id' <<<"$fields")
  gh project item-edit --project-id PVT_kwHOB7mUec4BocFo --id "$item" --field-id "$field" --single-select-option-id "$option"
}
set_field Category Bug
set_field Priority P2
```

- Changing a type or priority label → set the matching field the same way.
- `gh` needs the `project` scope: `gh auth refresh -s project` if a project command is refused.
