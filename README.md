# Angular Compatibility Maintenance Initiative

## Overview

The Angular Compatibility Maintenance Initiative is a dedicated repository designed to assist the Angular community in transitioning libraries from the View Engine to Ivy, and further maintaining them for compatibility with the latest versions of Angular. This initiative goes beyond the transition, aiming to keep these libraries updated with Angular's latest releases, albeit with a focus on maintenance for Angular version compatibility only, without addressing bugs or introducing new features.

## Purpose

This initiative addresses the need for a structured approach to maintain libraries that are no longer actively developed but are still widely used within the Angular ecosystem. By providing a temporary home for these libraries, the initiative ensures that projects depending on them can continue to upgrade to the latest Angular versions smoothly.

## Key Features

### Automated Maintenance Process

- **Library Detection**: Identifies libraries that are not compatible with the latest Angular versions or are at risk due to lack of active maintenance.
- **Issue Creation and PR Submission**: Automates the creation of issues and the submission of pull requests to update libraries to the latest Angular version, following the Angular update guidelines.

### Centralized Maintenance Repository

- **Version Compatibility**: Focuses on updating libraries to be compatible with the latest Angular versions.
- **NPM Package Warning**: All maintained packages will include an NPM warning advising users to plan the removal of the library from their projects, as these are intended as temporary solutions until a more permanent alternative is found or the library is officially updated.

### Contribution and Community Involvement

- **Open for Contributions**: Encourages the community to contribute by identifying libraries that require updates, submitting pull requests for version updates, and helping with repository management.
- **Continuous Integration (CI)**: Implements CI processes to test library compatibility with new Angular versions, ensuring that maintained libraries meet the required compatibility standards.

## Usage Warning

Users of libraries updated through this initiative are advised that these updates are focused solely on maintaining Angular version compatibility. The initiative does not extend to bug fixes, performance improvements, or the introduction of new features. Libraries are maintained as a stopgap measure, and users should plan to migrate to actively supported alternatives as they become available.

## Getting Involved

Contributors interested in supporting this initiative can do so in several ways, including identifying candidate libraries for maintenance, updating libraries to the latest Angular versions, and assisting in the overall management of the initiative's repository.

## Conclusion

The Angular Compatibility Maintenance Initiative plays a crucial role in supporting the Angular community by ensuring that even unmaintained libraries do not hinder the adoption of the latest Angular versions. By providing a mechanism for these libraries to receive necessary updates, the initiative helps maintain the ecosystem's health and facilitates smoother upgrade paths for Angular projects.
