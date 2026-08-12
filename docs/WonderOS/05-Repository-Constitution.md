\# WonderCards Repository Constitution



\*\*Version:\*\* 1.0 (Draft)



\---



\# Purpose



This document defines how the WonderCards repository is organised.



Its purpose is to ensure that every human contributor and every AI contributor follows the same architecture, structure, and documentation standards.



The repository is a long-term asset of WonderLabs.



\---



\# Core Principles



\## Single Source of Truth



Every concept must have one canonical location.



Avoid duplicate documentation.



Avoid duplicate implementations.



Avoid duplicate architecture.



\---



\## Documentation First



All major architectural decisions should follow:



Idea



↓



Discussion



↓



ADR



↓



Documentation



↓



Implementation



↓



Tests



↓



Review



\---



\## Repository Before Features



A clean repository is more valuable than fast feature delivery.



Good structure compounds over time.



Poor structure creates long-term technical debt.



\---



\# Repository Zones



The repository is divided into five logical zones.



\## Product



Responsible for the WonderCards application.



Examples:



\- app/

\- components/

\- core/

\- engine/

\- runtime/

\- platform/

\- sdk/

\- worker/

\- server/



\---



\## Studio



Internal tools used to build WonderCards.



Examples:



\- director/

\- builders/

\- studio/



\---



\## Knowledge



Project knowledge.



Examples:



\- docs/

\- content/

\- design/



\---



\## Testing



Verification.



Examples:



\- tests/



\---



\## Archive



Historical material.



Examples:



\- archive/



\---



\# Root Directory Rules



The repository root should remain intentionally minimal.



Allowed:



\- README.md

\- package.json

\- package-lock.json

\- tsconfig.json

\- next.config.\*

\- vitest.config.ts

\- app/

\- components/

\- engine/

\- runtime/

\- platform/

\- docs/

\- tests/

\- public/



Documentation files should not accumulate in the repository root.



\---



\# Documentation Rules



All documentation belongs inside docs/.



Suggested structure:



docs/



\- WonderOS/

\- architecture/

\- adr/

\- specs/

\- standards/

\- blueprints/

\- roadmap/



\---



\# Legacy Projects



Historical implementations should not interfere with active development.



Projects under review include:



\- WonderLabs-WLOS-v1.0

\- WonderCards-Client-MVP-Beast-Mode



Once confirmed inactive, they should be archived.



\---



\# Generated Files



Generated runtime files are not source code.



Examples include:



\- runtime state

\- scheduler state

\- factory backups

\- build cache



These should be excluded from version control where appropriate.



\---



\# AI Contributor Rules



AI contributors should always:



1\. Read WonderOS first.

2\. Follow repository structure.

3\. Prefer extending existing systems over creating duplicates.

4\. Document architectural decisions before implementation.



\---



\# Success Criteria



A healthy repository has:



\- a clean root

\- clear module boundaries

\- no duplicated documentation

\- no duplicated architecture

\- documented decisions

\- passing tests

\- successful builds



\---



\# Amendment Policy



This Constitution evolves with WonderCards.



Changes should be proposed through ADRs and reviewed before adoption.

