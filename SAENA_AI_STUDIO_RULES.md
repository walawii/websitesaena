# Saena — AI Studio / GitHub Synchronization Rules

## Source of truth
- Repository: `walawii/websitesaena`
- Production branch: `main`
- GitHub `main` is the authoritative source for Saena production code.
- AI Studio is a development interface; it must not replace the existing Saena architecture with a template/default implementation.

## Scope
- This repository is the Saena project for `saena.my.id`.
- Do NOT modify, remove, rename, migrate, or reinterpret anything belonging to the separate Alisa project.
- In particular, do not touch Alisa assets or routes merely because they exist in this repository.

## Before editing
1. Read the existing implementation and its imports/references.
2. Identify the smallest set of files that must change.
3. Preserve existing working architecture and configuration.
4. Never invent API endpoints, credentials, environment values, or provider settings.
5. Never put production secrets into source code.
6. Never reset, force-push, recreate, or replace the repository.

## Protected production configuration
Treat these as existing production configuration and do not replace them with AI Studio defaults:
- `vercel.json`
- `package.json`
- `server.ts`
- `backend.ts`
- `api/**`
- `server/**`
- `firebase-applet-config.json`
- `firestore.rules`
- DOKU integration
- Mengantar integration
- Meta CAPI integration
- Firebase/Firestore integration
- checkout/payment/shipping/webhook/inventory logic
- admin authentication
- deployment/build configuration

A change to one of these files is allowed only when the requested feature or a verified defect requires it. Preserve unrelated existing behavior.

## Environment variables
Do not create, delete, rename, or replace production environment variable values from AI Studio.
Never commit:
- DOKU secrets
- Mengantar credentials/secrets
- Meta access tokens
- admin secrets
- Firebase private/service-account credentials

If a new variable is genuinely required, document its NAME only and leave its value to the deployment environment.

## GitHub synchronization
Before every push:
1. Confirm the repository is `walawii/websitesaena`.
2. Confirm the target branch is `main`.
3. Review the complete diff.
4. Verify no Alisa files were changed.
5. Verify no secrets were introduced.
6. Run the available typecheck/build/tests.
7. Push only the intended changes.

## Conflict rule
When AI Studio and GitHub differ:
- Do not blindly overwrite GitHub with the AI Studio workspace.
- Treat the current GitHub `main` state as the baseline.
- Inspect the diff before resolving.
- Preserve existing production configuration unless a verified change is required.

## Quality gate
Do not report a task as complete when synchronization, build, typecheck, or required verification has not been performed.
