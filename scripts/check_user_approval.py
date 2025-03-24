#!/usr/bin/env python3
"""
Script to check for user approval before pushing code.
This script is intended to be used as a pre-push hook.
"""

import os
import re
import subprocess
import sys
from datetime import datetime

INTERACTION_LOG_PATH = "INTERACTION_LOG.md"
APPROVAL_PATTERN = r"feature set approved|user approval|approved by user"


def get_current_branch():
    """Get the name of the current branch."""
    result = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def check_interaction_log():
    """Check the INTERACTION_LOG.md file for user approval."""
    if not os.path.exists(INTERACTION_LOG_PATH):
        print(f"Error: {INTERACTION_LOG_PATH} does not exist.")
        return False
    
    with open(INTERACTION_LOG_PATH, "r") as f:
        content = f.read()
    
    # Check for user approval pattern in the interaction log
    if re.search(APPROVAL_PATTERN, content, re.IGNORECASE):
        print("User approval found in interaction log.")
        return True
    
    print(f"Error: No user approval found in {INTERACTION_LOG_PATH}.")
    print("Please demonstrate the feature to the user and get their approval before pushing.")
    print("The approval should be documented in the interaction log with phrases like:")
    print("  - 'feature set approved'")
    print("  - 'user approval'")
    print("  - 'approved by user'")
    return False


def check_tests_pass():
    """Check if all tests pass."""
    print("Running backend tests...")
    backend_result = subprocess.run(
        ["python", "-m", "pytest"],
        capture_output=True,
        text=True,
    )
    
    if backend_result.returncode != 0:
        print("Error: Backend tests failed.")
        print(backend_result.stdout)
        print(backend_result.stderr)
        return False
    
    print("Backend tests passed.")
    
    # Check if frontend directory exists
    if os.path.exists("src/frontend"):
        print("Running frontend tests...")
        os.chdir("src/frontend")
        frontend_result = subprocess.run(
            ["npm", "test"],
            capture_output=True,
            text=True,
        )
        os.chdir("../..")
        
        if frontend_result.returncode != 0:
            print("Error: Frontend tests failed.")
            print(frontend_result.stdout)
            print(frontend_result.stderr)
            return False
        
        print("Frontend tests passed.")
    
    return True


def main():
    """Main function to check for user approval before pushing code."""
    branch = get_current_branch()
    
    # Skip checks for main branch or if it's a documentation branch
    if branch == "main" or branch.startswith("docs/"):
        print(f"Skipping user approval check for {branch} branch.")
        return 0
    
    # Check for user approval in interaction log
    if not check_interaction_log():
        return 1
    
    # Check if tests pass
    if not check_tests_pass():
        return 1
    
    print("All checks passed. Ready to push!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
