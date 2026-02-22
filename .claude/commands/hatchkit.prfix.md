---
description: Review and resolve all unresolved review threads on the current PR.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Fetch all **unresolved** review threads on the current PR, deduplicate related feedback, implement fixes, push, then reply and resolve each thread. This command MUST run only after a PR has been created and is active.

## Operating Constraints

- Keep changes focused on addressing feedback — no unrelated modifications.
- The project constitution (`.specify/memory/constitution.md`) is non-negotiable; constitution conflicts are automatically CRITICAL.
- **Do NOT use `get_pull_request_comments` or `get_pull_request_reviews` MCP tools** — they return all comments (resolved + unresolved) and can exceed context limits on large PRs. Use the GraphQL API via `gh api graphql` exclusively for thread retrieval.

## Execution Steps

### 1. Discover the PR

Auto-detect the PR number from the current branch:

```bash
gh pr view --json number,url,headRefName --jq '{number, url, headRefName}'
```

If no PR is found, stop and inform the user.

### 2. Fetch Unresolved Review Threads

Use the GraphQL API to retrieve only **unresolved** threads. Filter client-side on `isResolved == false`:

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            path
            line
            comments(first: 10) {
              nodes {
                author { login }
                body
                createdAt
              }
            }
          }
        }
      }
    }
  }' -f owner=OWNER -f repo=REPO -F pr=NUMBER
```

Replace `OWNER`, `REPO`, and `NUMBER` with actual values from Step 1. Filter the result to only threads where `isResolved == false`.

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

**After pushing** (so reviewers see the fix commit), reply to each thread and resolve it. Use the GraphQL `resolveReviewThread` mutation:

```bash
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { isResolved }
    }
  }' -f threadId=THREAD_NODE_ID
```

For each thread:
1. Add a reply comment explaining how the feedback was addressed (or why you disagree)
2. Resolve the thread using the mutation above

The `threadId` is the `id` field from the `reviewThreads.nodes` returned in Step 2.

**Batch pattern** — when there are >10 threads, use a shell loop:

```bash
for tid in THREAD_ID_1 THREAD_ID_2 THREAD_ID_3; do
  gh api graphql -f query='
    mutation($threadId: ID!) {
      resolveReviewThread(input: { threadId: $threadId }) {
        thread { isResolved }
      }
    }' -f threadId="$tid"
done
```

To add a reply comment before resolving:

```bash
gh api graphql -f query='
  mutation($threadId: ID!, $body: String!) {
    addPullRequestReviewThreadReply(input: {
      pullRequestReviewThreadId: $threadId
      body: $body
    }) {
      comment { id }
    }
  }' -f threadId=THREAD_NODE_ID -f body="Fixed in latest push — ..."
```

### 9. Verify CI

After pushing, compare the check status to what it was **before** your changes. Pre-existing failures are not your responsibility — only ensure you haven't introduced new ones:

```bash
gh pr checks
```

If a check that was previously passing now fails, investigate and fix.

### 10. Finalize Comment

Add a final PR comment summarizing:
- How many threads were resolved
- Key changes grouped by theme
- Any threads where you disagreed and why

## GraphQL Quick Reference

| Operation | Mutation / Query | Key Input Field |
|-----------|-----------------|-----------------|
| List threads | `pullRequest.reviewThreads` | `first: 100` |
| Resolve thread | `resolveReviewThread` | `threadId` (node ID from query) |
| Reply to thread | `addPullRequestReviewThreadReply` | `pullRequestReviewThreadId` (same node ID) |
| Add issue comment | `addComment` | `subjectId` (PR node ID) |

## Context

$ARGUMENTS
