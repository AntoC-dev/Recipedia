# Issues

New issue → add to [project 3](https://github.com/users/AntoC-dev/projects/3), set **Category** + **Priority** (labels
don't fill them). Label changed later → update field too.

- Category: `bug`→Bug, `enhancement`→Feature, `refactor`→Refactor, `test`→Test, `exploration`→Exploration, `ci`→CI,
  `dependencies`→Dependencies, `documentation`→Documentation
- Priority: `p0-critical`→P0, `p1-high`→P1, `p2-medium`→P2

```bash
item=$(gh project item-add 3 --owner AntoC-dev --url "$issue_url" --format json --jq .id)
fields=$(gh project field-list 3 --owner AntoC-dev --format json)
set_field() { gh project item-edit --project-id PVT_kwHOB7mUec4BocFo --id "$item" $(jq -r --arg f "$1" --arg o "$2" \
  '.fields[] | select(.name==$f) | "--field-id \(.id) --single-select-option-id \(.options[] | select(.name==$o) | .id)"' <<<"$fields"); }
set_field Category Bug; set_field Priority P2
```

Refused → `gh auth refresh -s project`.
