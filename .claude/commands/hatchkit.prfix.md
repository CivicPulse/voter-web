---
description: Review and resolve all unresolved review threads on the current PR.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Prerequisites

- The `gh` CLI must be installed and authenticated (`gh auth status`).
- A pull request must exist for the current branch.

## Goal

Fetch all **unresolved** review threads on the current PR, deduplicate related feedback, implement fixes, push, then reply and resolve each thread. This command MUST run only after a PR has been created and is active.

## Operating Constraints

- Keep changes focused on addressing feedback — no unrelated modifications.
- The project constitution (`.specify/memory/constitution.md`) is non-negotiable; constitution conflicts are automatically CRITICAL.

## Execution Steps

### 1. Discover the PR

Auto-detect the PR number from the current branch:

```bash
hatchkit pr info
```

If no PR is found, stop and inform the user.

### 2. Fetch Unresolved Review Threads

Retrieve only **unresolved** threads:

```bash
hatchkit pr threads
```

To include resolved threads as well, use:

```bash
hatchkit pr threads --all
```

You can also specify the owner, repo, and PR number explicitly:

```bash
hatchkit pr threads --owner OWNER --repo REPO --pr NUMBER
```

If the PR has zero unresolved threads, stop and inform the user.

### 3. Deduplicate and Categorize

Before implementing anything, group threads by **file + topic**. Multiple reviewers (or bots like CodeRabbit) often flag the same issue — e.g., three threads about error handling in the same file. Identify clusters and plan a single fix per cluster.

Categorize each item as:

- **Code change** — refactoring, bug fix, performance, style
- **Documentation update** — comments, docstrings, README
- **Disagree** — provide a respectful explanation instead of a code change
- **Non-actionable** — compliments, general comments (acknowledge and resolve)

Note: CodeRabbit feedback often includes an AI prompt to consider. If you disagree, explain your reasoning when replying in Step 8.

### 4. Prioritize and Plan

Order work by severity and dependencies. Outline the specific changes needed per file. If the user provided input, incorporate their priorities.

### 5. Implement Fixes

Make the necessary code changes, documentation updates, or design adjustments. Address each deduplicated cluster, not each individual thread.

### 6. Lint and Test

```bash
uv run ruff check . && uv run ruff format --check .
uv run pytest
```

Fix any failures introduced by the changes. If available, use the SonarQube MCP to check code quality.

### 7. Commit and Push

Commit with a summary-style message grouped by theme, not per-thread:

```
fix(test): address PR review feedback

- batch user deletes in E2E cleanup for performance
- replace bare dict with typed Pydantic model in 3 endpoints
- add missing 404 assertion to boundary detail test
```

Push to the PR branch.

### 8. Reply and Resolve Threads

**After pushing** (so reviewers see the fix commit), reply to each thread and resolve it:

```bash
hatchkit pr reply THREAD_NODE_ID "Fixed in latest push — <brief explanation>"  --resolve
```

For threads where you only need to reply without resolving:

```bash
hatchkit pr reply THREAD_NODE_ID "Acknowledged — this is by design because..."
```

To resolve a thread without adding a reply:

```bash
hatchkit pr resolve THREAD_NODE_ID
```

The `THREAD_NODE_ID` is the `id` field from the thread objects returned in Step 2.

### 9. Verify CI

After pushing, compare the check status to what it was **before** your changes. Pre-existing failures are not your responsibility — only ensure you haven't introduced new ones:

```bash
hatchkit pr checks
```

If a check that was previously passing now fails, investigate and fix.

### 10. Finalize Comment

Add a final PR comment summarizing:
- How many threads were resolved
- Key changes grouped by theme
- Any threads where you disagreed and why

## Context

$ARGUMENTS
