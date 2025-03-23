#!/usr/bin/env python3
"""
Script to automatically update the CHANGELOG.md file with commit messages.
This script is intended to be used as a pre-commit hook.
"""

import os
import re
import subprocess
from datetime import datetime

CHANGELOG_PATH = "CHANGELOG.md"
UNRELEASED_PATTERN = r"## \[Unreleased\]\n\n### Added\n"
UNRELEASED_SECTION = "## [Unreleased]\n\n### Added\n"


def get_staged_files():
    """Get a list of staged files that will be committed."""
    result = subprocess.run(
        ["git", "diff", "--name-only", "--cached"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip().split("\n")


def get_commit_message():
    """Get the commit message from the COMMIT_EDITMSG file."""
    git_dir = subprocess.run(
        ["git", "rev-parse", "--git-dir"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    
    commit_msg_file = os.path.join(git_dir, "COMMIT_EDITMSG")
    
    if os.path.exists(commit_msg_file):
        with open(commit_msg_file, "r") as f:
            message = f.read().strip()
            # Remove comment lines
            message = re.sub(r"^#.*$", "", message, flags=re.MULTILINE)
            return message.strip()
    
    return None


def update_changelog(commit_message):
    """Update the CHANGELOG.md file with the commit message."""
    if not os.path.exists(CHANGELOG_PATH):
        print(f"Warning: {CHANGELOG_PATH} does not exist. Skipping changelog update.")
        return
    
    with open(CHANGELOG_PATH, "r") as f:
        content = f.read()
    
    # Skip if CHANGELOG.md is being modified in this commit
    staged_files = get_staged_files()
    if CHANGELOG_PATH in staged_files:
        print(f"Note: {CHANGELOG_PATH} is being modified in this commit. Skipping automatic update.")
        return
    
    # Skip if commit message starts with "chore:" or similar
    if re.match(r"^(chore|docs|style|refactor|test):", commit_message.lower()):
        print("Skipping changelog update for chore/docs/style/refactor/test commit.")
        return
    
    # Determine which section to update based on commit message
    if re.match(r"^feat(\(.+\))?:", commit_message.lower()):
        section = "### Added\n"
        entry = f"- {commit_message.split(':', 1)[1].strip()}\n"
    elif re.match(r"^fix(\(.+\))?:", commit_message.lower()):
        # Check if Changed section exists, if not create it
        if "### Changed\n" not in content:
            content = content.replace(
                UNRELEASED_SECTION,
                UNRELEASED_SECTION + "### Changed\n",
            )
        section = "### Changed\n"
        entry = f"- {commit_message.split(':', 1)[1].strip()}\n"
    elif re.match(r"^breaking(\(.+\))?:|^!:", commit_message.lower()):
        # Check if Breaking section exists, if not create it
        if "### Breaking Changes\n" not in content:
            content = content.replace(
                UNRELEASED_SECTION,
                UNRELEASED_SECTION + "### Breaking Changes\n",
            )
        section = "### Breaking Changes\n"
        entry = f"- {commit_message.split(':', 1)[1].strip() if ':' in commit_message else commit_message}\n"
    else:
        # Default to Added section for other commit types
        section = "### Added\n"
        entry = f"- {commit_message}\n"
    
    # Add entry to the appropriate section
    section_pos = content.find(section) + len(section)
    updated_content = content[:section_pos] + entry + content[section_pos:]
    
    with open(CHANGELOG_PATH, "w") as f:
        f.write(updated_content)
    
    print(f"Updated {CHANGELOG_PATH} with: {entry.strip()}")


def main():
    """Main function to update the changelog."""
    commit_message = get_commit_message()
    if commit_message:
        update_changelog(commit_message)
    else:
        print("Could not determine commit message. Skipping changelog update.")


if __name__ == "__main__":
    main()
