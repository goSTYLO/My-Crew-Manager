AI Project Flow - Context

Overview
- Separate two-step flow:
  1) Create Project (simple form)
  2) Upload & Analyze Proposal (optional upload, then analyze)

Entry Points
- FAB on `projects_page.dart` should open `CreateProjectSimplePage`.
- After successful creation, navigate to `UploadAnalyzePage(projectId, initialTitle)`.

Screens
- `features/project/presentation/pages/create_project_simple_page.dart`
  - Inputs: title, summary
  - Action: Create Project → POST `ai/projects/`
  - Success: `Navigator.pushReplacement(UploadAnalyzePage.route(projectId, initialTitle))`

- `features/project/presentation/pages/upload_analyze_page.dart`
  - Buttons: Upload PDF, Analyze
  - Upload: `ProjectRemoteDataSource.uploadProposal(projectId, filePath)` → stores `proposal_id`
  - Analyze: `ProjectRemoteDataSource.ingestProposal(projectId, proposalId?, titleOverride)`
    - Populates summary, roles (newline separated), features/tasks (newline separated)
  - After analyze: Save and Generate Backlog buttons appear
    - Save: `PATCH ai/projects/{id}/` with edited summary
    - Generate: navigates to `GenerateBacklogPage`

- `features/project/presentation/pages/generate_backlog_page.dart`
  - Generates backlog: `PUT ai/projects/{id}/generate-backlog/`
  - Placeholder area for upcoming backlog tools (review, edit, export, assign)
  - Notes: Analyze can be triggered without upload if backend supports it; otherwise upload first.

Backend (ai_api)
- `POST ai/projects/` → create project
- `POST ai/proposals/` → upload PDF (returns `proposal_id`)
- `PUT ai/projects/{id}/ingest-proposal/{proposal_id}/` → run LLM summarization
  - If proposal is optional, backend should handle missing `proposal_id` (current code expects it)

Model Loading Notes (Windows vs Linux)
- 4-bit quantization is disabled on native Windows; a standard FP model is used.
- 4-bit is only enabled on CUDA/Linux when `bitsandbytes` is present.

Future Enhancements Ideas
- Save edited AI summary back to project (PATCH `ai/projects/{id}/`).
- Display generated backlog and link to backlog pages.
- Attach multiple proposals and re-run analysis.


