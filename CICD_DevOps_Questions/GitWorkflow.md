# Git Workflow and Branching

## 1. Core concepts

| Term | Definition |
|---|---|
| **Repository** | The project plus its entire history |
| **Commit** | A snapshot of the project at a point in time, with a parent pointer |
| **Branch** | A movable pointer to a commit — cheap to create |
| **HEAD** | A pointer to the commit you currently have checked out |
| **Remote** | A copy of the repository hosted elsewhere (`origin`) |
| **Staging area (index)** | The set of changes that will go into the next commit |

**The three areas:**

```
Working Directory  →  Staging Area  →  Repository
   (your edits)        (git add)       (git commit)
```

---

## 2. Everyday commands

```bash
# Status and history
git status
git log --oneline --graph --all         # the most useful log view
git diff                                 # unstaged changes
git diff --staged                        # staged changes

# Branching
git switch -c feature/login              # create and switch (modern)
git checkout -b feature/login            # the older equivalent
git switch main
git branch -d feature/login              # delete (safe - refuses if unmerged)
git branch -D feature/login              # force delete

# Committing
git add .
git add -p                               # stage hunk by hunk - review as you go
git commit -m "add login validation"
git commit --amend                       # fix the LAST commit (before pushing)

# Syncing
git fetch origin                         # download, do not merge
git pull                                 # fetch + merge
git pull --rebase                        # fetch + rebase - cleaner history
git push -u origin feature/login
```

---

## 3. Merge vs Rebase

**Definition of Merge:** Combines two branches by creating a new **merge commit** with two parents. History is preserved exactly as it happened.

**Definition of Rebase:** Replays your commits **on top of** another branch, creating new commits with new hashes. History becomes a straight line.

```
BEFORE
main:    A---B---C
              \
feature:       D---E

AFTER MERGE                    AFTER REBASE
main:    A---B---C---M         main:    A---B---C---D'---E'
              \     /
feature:       D---E           (D and E are rewritten as D' and E')
```

| | Merge | Rebase |
|---|---|---|
| History | True, with branches | Linear and clean |
| Creates new commits | One merge commit | Rewrites all of yours |
| Safe on shared branches | ✅ Yes | ❌ **No** |
| Conflict resolution | Once | Potentially once per commit |

### The golden rule of rebasing

> **Never rebase a branch that other people have pulled.**

Rebasing rewrites commit hashes. If a colleague has the old commits, their history and yours diverge, and the next merge creates duplicates and chaos.

**Safe:** rebasing your own unpushed feature branch onto the latest `main`.
**Unsafe:** rebasing `main` itself, or a shared branch.

```bash
# Standard workflow: keep your feature branch current
git switch feature/login
git fetch origin
git rebase origin/main        # replay your work on top of the latest main

# If conflicts appear
# ...fix the files...
git add .
git rebase --continue
# or bail out entirely
git rebase --abort
```

---

## 4. Branching strategies

### Git Flow

**Definition:** A structured model with long-lived `main` and `develop` branches, plus `feature/`, `release/` and `hotfix/` branches.

```
main     ────────●──────────────●────   (production, tagged releases)
                 │              │
release          │       ┌──────┤
develop  ──●──●──┴───●───┴──●───┴───    (integration)
           │  │       │     │
feature    └──┘       └─────┘
```
**Good for:** versioned software with scheduled releases and multiple supported versions.
**Bad for:** continuous deployment — too much ceremony and long-lived branches cause painful merges.

### GitHub Flow

**Definition:** One long-lived branch (`main`), which is always deployable. Every change is a short-lived feature branch merged via pull request.

```
main ──●───●───●───●───●──  (always deployable, deploy on every merge)
        \     /   \   /
         ●───●     ●─●      (short-lived feature branches)
```
**Good for:** web applications with continuous deployment. **This is what most teams use.**

### Trunk-Based Development

**Definition:** Everyone commits to `main` (the trunk) at least daily, with branches living hours rather than days. Incomplete work hides behind **feature flags**.

**Good for:** experienced teams with strong automated testing. It is the model behind the highest-performing engineering organisations, but it requires real discipline and test coverage.

| Strategy | Branch lifetime | Best for |
|---|---|---|
| Git Flow | Weeks | Versioned/desktop software |
| GitHub Flow | Days | Web apps, most teams |
| Trunk-based | Hours | High-velocity teams with strong CI |

---

## 5. Pull Requests

**Definition:** A request to merge one branch into another, providing a place for automated checks and human review before the code lands.

**A good PR:**
- **Small** — under ~400 lines changed. Large PRs get rubber-stamped, not reviewed.
- **One concern** — do not mix a refactor with a bug fix.
- **Descriptive title and body** — what changed, why, and how to test it.
- **Green CI** before requesting review.
- **Self-reviewed first** — read your own diff before asking someone else to.

**Branch protection rules worth enabling on `main`:**
- Require a passing status check before merge
- Require at least one approving review
- Require the branch to be up to date before merging
- Block force pushes

**Merge options:**

| Option | Result |
|---|---|
| **Merge commit** | Keeps every commit plus a merge commit |
| **Squash and merge** | All commits become **one** commit on main — keeps history clean |
| **Rebase and merge** | Commits are replayed linearly, no merge commit |

Squash merging is the most common default — the feature branch's messy "wip", "fix typo" commits collapse into one meaningful commit.

---

## 6. Undoing things

```bash
# Discard unstaged changes to a file
git restore file.js
git checkout -- file.js                  # older syntax

# Unstage a file (keep the edit)
git restore --staged file.js

# Fix the last commit message (ONLY if not pushed)
git commit --amend -m "better message"

# Undo the last commit, KEEP the changes staged
git reset --soft HEAD~1

# Undo the last commit, keep changes unstaged
git reset HEAD~1

# Undo the last commit and DESTROY the changes
git reset --hard HEAD~1                  # ⚠️ unrecoverable if never committed

# Undo a commit that is already PUSHED - creates a new inverse commit
git revert <commit-sha>                  # ✅ safe on shared branches
```

**`reset` vs `revert`:**

| | `reset` | `revert` |
|---|---|---|
| What it does | Moves the branch pointer back | Creates a **new** commit undoing the old one |
| Rewrites history | ✅ Yes | ❌ No |
| Safe on a pushed branch | ❌ No | ✅ **Yes** |

> **Rule:** use `revert` for anything already pushed. Use `reset` only on local, unpushed work.

### Stash

**Definition:** Temporarily shelve uncommitted changes so you can switch branches.

```bash
git stash                     # shelve current changes
git stash -u                  # include untracked files
git stash list
git stash pop                 # reapply and remove from the stash
git stash apply               # reapply but keep it in the stash
git stash drop
```

### Recovering "lost" commits

**Definition:** `git reflog` records every position HEAD has pointed at, including after a bad `reset`. Almost nothing is truly lost for ~30 days.

```bash
git reflog                    # find the sha you want back
git reset --hard <sha>
```

---

## 7. Resolving conflicts

**Definition:** A conflict happens when two branches change the **same lines** of the same file, and git cannot decide which to keep.

```
<<<<<<< HEAD
const timeout = 3000;          ← what is currently on your branch
=======
const timeout = 5000;          ← what is coming in
>>>>>>> feature/timeout
```

```bash
# 1. See which files conflict
git status

# 2. Edit each file - remove ALL the markers, keep the correct result
# 3. Mark as resolved
git add file.js

# 4. Finish
git commit                    # for a merge
git rebase --continue         # for a rebase
```

**Reducing conflicts:** pull frequently, keep branches short-lived, keep PRs small, and agree on formatting (Prettier) so whitespace never causes one.

---

## 8. Useful extras

```bash
# Find which commit introduced a bug - binary search through history
git bisect start
git bisect bad                 # current version is broken
git bisect good v1.0           # this old version worked
# git checks out a midpoint; you test and mark good/bad until it finds the culprit
git bisect reset

# Who changed this line and when
git blame file.js
git log -S "functionName"      # find commits that added/removed a string

# Bring a single commit from another branch
git cherry-pick <sha>

# Move a whole file, preserving history
git mv old.md new/path.md
```

---

## 9. Commit message conventions

**Definition of Conventional Commits:** A format that makes history scannable and can drive automatic changelog and version generation.

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that is neither a fix nor a feature |
| `test` | Adding or fixing tests |
| `chore` | Build process, dependencies, tooling |
| `perf` | Performance improvement |

```
feat(auth): add refresh token rotation

Access tokens now expire after 15 minutes and are refreshed using a
rotating refresh token stored in an HttpOnly cookie.

Closes #142
```

**Practical rules:** imperative mood ("add", not "added"), subject under ~72 characters, explain **why** in the body rather than restating what the diff shows.

---

## Key points

- Merge preserves true history; rebase creates a linear one but **rewrites commits**.
- **Never rebase anything others have pulled.**
- GitHub Flow (short branches off an always-deployable `main`) suits most web teams.
- Keep PRs small and single-purpose; squash merge to keep history readable.
- `revert` for pushed commits, `reset` only for local ones.
- `git reflog` recovers almost anything you think you destroyed.
- Frequent pulls and small branches are the real fix for merge conflicts.
- `git bisect` finds the commit that introduced a bug quickly.
