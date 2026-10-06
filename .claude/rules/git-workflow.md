# Git Workflow

- Branch names must follow `CONTRIBUTING.md` → Branch Naming: `<type>/<issue#>-<short-desc>`, type one of `feature`,
  `bugfix`, `docs`, `refactor` (e.g. `bugfix/358-editrecipe-verify`, not `fix-358-editrecipe-verify`)
- Applies to worktree branches too — check `CONTRIBUTING.md` before naming a branch in a spawned/worktree agent
- Remove worktree dirs when work is done — never leave orphaned worktrees behind
- Conventional commits, semantic scopes
- Husky/lint-staged enforces quality on commit
