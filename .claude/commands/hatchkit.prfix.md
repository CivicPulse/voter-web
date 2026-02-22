---
description: Review and resolve all the comments, feedback, suggestions, and unresolved conversions on current PR. 
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Identify and resolve all comments, feedback, suggestions, and unresolved conversations on the current PR. This command MUST run only after a PR has been created and is active.

## Operating Constraints

Keep changes focused on addressing the feedback without introducing unrelated modifications. Ensure that all resolutions are clearly documented in the PR conversation for transparency.

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is **non-negotiable** within this analysis scope. Constitution conflicts are automatically CRITICAL and require adjustment of the spec, plan, or tasks—not dilution, reinterpretation, or silent ignoring of the principle. If a principle itself needs to change, that must occur in a separate, explicit constitution update outside `/hatchkit.prfix`.

## Execution Steps

### 1. Fetch PR Feedback

Use the GitHub MCP, CLI, or API to retrieve all comments, feedback, suggestions, and unresolved conversations associated with the current PR. Organize them by file, line number, and author for clarity.

### 2. Analyze Feedback

Categorize feedback into actionable items, such as:

- Code changes (e.g., refactoring, bug fixes)
- Documentation updates
- Design adjustments
- Clarification requests
- Non-actionable feedback (e.g., compliments, general comments)
- Findings that you disagree with (these require a response rather than a change)

### 3. Prioritize and Plan Resolutions

Prioritize actionable items based on severity, impact, and dependencies. Create a resolution plan that outlines the specific changes needed, the files affected, and the rationale for each change.

### 4. Implement Resolutions

Make the necessary code changes, documentation updates, or design adjustments to address the feedback. Ensure that all changes are focused on resolving the specific feedback without introducing unrelated modifications.

### 5. Document Resolutions

For each resolved item, add a comment in the PR conversation explaining how the feedback was addressed. If you disagree with certain feedback, provide a clear and respectful explanation for your decision.

### 6. Run Tests, linting, and CI

After implementing changes, run all relevant tests, linters, and CI checks to ensure that the resolutions do not introduce new issues. Address any failures that arise from the changes.

### 7. Commit and Push Changes

Commit the changes with a clear message that references the resolved feedback (e.g., "Resolve feedback from @reviewer on line 42 of file.js"). Push the changes to the PR branch.

### 8. Resolve Conversations

After pushing changes, mark the relevant conversations as resolved in the PR interface. Ensure that all feedback has been addressed and that the PR is ready for final review or merging. If any feedback remains unresolved, provide a clear explanation in the PR conversation and seek further clarification if needed.

### 9. Await Actions

After resolving all conversations, wait for all github actions to complete. If any actions fail, investigate the cause, address any issues, and push necessary fixes. Ensure that the PR is in a mergeable state with all checks passing before proceeding. 

### 10. Finaize Comment

Once all feedback has been addressed and all conversations resolved, add a final comment summarizing the changes made in response to the feedback and thanking the reviewers for their input. This promotes a positive and collaborative review process.

## Context

$ARGUMENTS
