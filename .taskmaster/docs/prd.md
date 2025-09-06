Project Name: MyCrewManager: AI-Powered Sprint & Backlog Assistant

0. Current Focus

Objective: Focus on coding and implementing the AI/LLM setup for task parsing and backlog automation.

Set up the LLM pipeline to process PDF proposals and generate structured project data.

Integrate AI for task generation, roles extraction, and sprint planning.

Ensure system readiness for developers to interact with tasks via the sprint feed.

Only generate tasks that involve coding, AI integration, or core backend/frontend setup for the LLM pipeline.

1. Executive Summary

MyCrewManager is an AI-driven project management platform designed to automate sprint planning, backlog generation, and team collaboration. The system enables project managers to upload proposals, automatically generate structured backlogs (epics, sub-epics, user stories), and organize tasks into sprints. Developers interact with tasks through a sprint feed, log voice check-ins, and receive gamified achievements. AI serves as the Sprint Architect, parsing proposals and building actionable plans.

Current Priority: Implement and validate the AI/LLM pipeline for proposal parsing, task generation, and sprint initialization.

2. Objectives & Scope

Objectives:

Automate parsing of project proposals into structured plans via AI/LLM.

Provide project managers with tools to manage members, sprints, and backlogs.

Allow developers to view and update tasks, log progress via voice check-ins, and gain achievements.

Generate reports in PDF/CSV format for monitoring and progress tracking.

Scope:

Upload & parse PDF proposals into structured data.

AI/LLM setup for backlog hierarchy generation (Epics → Sub-Epics → User Stories → Tasks).

Sprint management with role-based task assignment.

Developer tools for task updates, voice logs, and gamification.

Reporting features for project monitoring.

3. Actors & Use Cases

Actors:

👤 Project Manager

Upload Proposal

Initiate Project Creation (Summary, Members, Tasks, Sprints)

Request Backlog Generation

Edit Backlog

Manage Members (add/remove/update roles)

Generate Reports

🤖 AI Sprint Architect

Analyze Proposal → Parse PDF → Generate Summary, Members, Sprints

Generate Backlog (Epics, Sub-Epics, User Stories, Dependencies)

Current Focus: AI/LLM implementation for task parsing and backlog automation

👨‍💻 Developer

View Tasks (Sprint Feed)

Update Task Status

Log Voice Check-in

Gain Achievements (Gamification)

4. Functional Requirements
Proposal & Project Management

Upload proposal in PDF format.

AI/LLM parses proposal and extracts key details.

Project initialization with summary, members, sprints, and tasks.

Backlog Management

AI/LLM generates backlog hierarchy.

Editable backlog for project manager.

Support for dependencies between backlog items.

Sprint Planning

Create and manage sprints (duration, start, end dates).

Assign tasks based on required roles.

Link user stories → tasks → sprints.

Developer Interaction

Sprint feed view of tasks.

Task updates (status changes).

Voice log recording with AI-generated transcription & summary.

Gamification rewards (badges, points).

Reporting

Generate reports (PDF, CSV).

Include progress tracking, sprint completion, and achievements.

5. Data Model
Core Entities (from UML & ERD)

User → id, name, email, passwordHash, profileImage

Members → id, role, projectID, userID

Proposal → id, filePath, parsedText, uploadedDate, uploadedBy

Project → id, title, summary, proposalID, createdBy

Backlog → id, projectID, createdDate, lastUpdated

Epic → id, backlogID, title, description

SubEpic → id, epicID, title, description

UserStory → id, subEpicID, title, description, acceptanceCriteria

Task → id, projectID, sprintID, title, description, status, role

UserTask → id, userStoryID, taskID

Sprint → id, projectID, duration, startDate, endDate

VoiceLog → id, developerID, audioPath, transcript, createdDate

Gamification → id, developerID, badgeName, points, earnedDate

Report → id, projectID, reportType, filePath, generatedDate

6. System Interactions (from Sequence Diagram)

Phase 1: Proposal Upload & Initialization

Project Manager uploads PDF proposal.

AI/LLM parses and generates project summary, members, and sprints.

Project initialized in the system.

Phase 2: Backlog Generation

Project Manager requests backlog.

AI/LLM generates epics → sub-epics → user stories.

Editable backlog is displayed.

Phase 3: Sprint Planning

Project Manager creates sprint (duration, start, end).

Tasks mapped from user stories.

Tasks assigned to members by role.

Phase 4: Execution

Developer views sprint tasks.

Developer updates task status.

Developer logs voice check-in.

Gamification engine awards points/badges.

Phase 5: Reporting

Project Manager requests report.

System generates PDF/CSV.

Delivered to Project Manager.

7. Roadmap (Sprints Instead of Timeline)

Sprint 1: Core project setup (Proposal upload, parsing, project initialization, AI/LLM setup).
Sprint 2: Backlog generation & editing (focus on AI/LLM parsing logic).
Sprint 3: Sprint creation, task mapping, member management.
Sprint 4: Developer task feed, status updates, voice logs.
Sprint 5: Gamification & reporting.
Sprint 6: Polishing, bug fixes, optimizations.