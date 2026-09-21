# CI/CD & DevOps Interview Questions

📄 **[CICDImpQue.md](CICDImpQue.md)** — all 50 questions with answers in one file.

---

## Topic files

| Topic | File | Covers |
|---|---|---|
| **CI/CD Fundamentals** | [CICDFundamentals.md](CICDFundamentals.md) | CI vs CD vs CD, pipeline stages, environments, build-once, deployment strategies, DB migrations, rollback, monitoring, secrets |
| **GitHub Actions & Docker** | [GitHubActionsAndDocker.md](GitHubActionsAndDocker.md) | Workflows, jobs, matrix, caching, secrets, Dockerfile, multi-stage builds, layer caching, Compose |
| **Git Workflow** | [GitWorkflow.md](GitWorkflow.md) | Merge vs rebase, branching strategies, PRs, undoing things, conflicts, bisect, conventional commits |
| Docker basics | [Docker.md](Docker.md) | Short intro note |

---

## All 50 questions ([CICDImpQue.md](CICDImpQue.md))

**CI/CD Concepts (1–15)**
1. What is CI/CD?
2. Difference between Continuous Delivery and Continuous Deployment?
3. What are the typical stages of a pipeline?
4. What does "build once, deploy many" mean?
5. What are the deployment strategies?
6. What is blue-green deployment?
7. What is a canary release?
8. What are feature flags and why are they useful?
9. How do you handle database migrations in CI/CD?
10. How do you roll back a bad deployment?
11. What should you monitor after a deploy?
12. How do you manage secrets in a pipeline?
13. What are flaky tests and why are they a problem?
14. Your pipeline takes 40 minutes. How do you speed it up?
15. What is the difference between staging and production?

**Docker (16–30)**
16. What is Docker and what problem does it solve?
17. Difference between an image and a container?
18. Difference between Docker and a virtual machine?
19. What is a multi-stage build?
20. How does Docker layer caching work and how do you optimise for it?
21. What is a `.dockerignore` and why does it matter?
22. Why should a container not run as root?
23. How do you persist data in Docker?
24. Why should you never put secrets in a Dockerfile?
25. What is Docker Compose?
26. In Compose, why does `localhost` not work between services?
27. What is a health check in Docker?
28. How do you reduce Docker image size?
29. Difference between `CMD` and `ENTRYPOINT`?
30. What is Kubernetes and when do you need it?

**Git (31–45)**
31. Difference between merge and rebase?
32. When should you never rebase?
33. Difference between `git reset` and `git revert`?
34. Difference between `git fetch` and `git pull`?
35. What is `git stash` for?
36. You committed to the wrong branch. How do you fix it?
37. How do you recover a commit after `git reset --hard`?
38. What are the branching strategies?
39. What is `git cherry-pick`?
40. What is `git bisect`?
41. How do you resolve a merge conflict?
42. What makes a good pull request?
43. What is squash merging and when would you use it?
44. What are conventional commits?
45. What are branch protection rules worth enabling?

**Scenario (46–50)**
46. Production is broken after a deploy. Walk me through what you do.
47. How would you set up CI/CD for a Node.js app from scratch?
48. How do you prevent a broken `main` branch?
49. A test passes locally but fails in CI. How do you debug it?
50. How would you deploy with zero downtime?

---

## The comparisons that get asked most

| Question | Short answer |
|---|---|
| Continuous Delivery vs Deployment | Delivery has a manual approval gate; Deployment does not |
| Image vs Container | Blueprint vs running instance |
| Docker vs VM | Shares the host kernel (MB, ms) vs full guest OS (GB, minutes) |
| Merge vs Rebase | True history vs linear history (rewrites hashes) |
| `reset` vs `revert` | Rewrites history (local only) vs new inverse commit (safe when pushed) |
| `fetch` vs `pull` | Download only vs download + merge |
| Blue-Green vs Canary | Instant switch at 2× cost vs gradual rollout with monitoring |

---

**Related:** [Node auth & deployment](../Nextjs_Interview_Questions/AuthAndDeployment.md) · [npm & security](../Node_Backend_Questions/NpmAndSecurity.md) · **All questions:** [../ALL_QUESTIONS.md](../ALL_QUESTIONS.md)
