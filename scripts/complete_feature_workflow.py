#!/usr/bin/env python3
"""
Script to automate the PR creation, review, merge, and cleanup process.
This script is intended to be used after pushing a feature branch.
"""

import os
import re
import subprocess
import sys
import json
import time
import argparse
from datetime import datetime

def get_current_branch():
    """Get the name of the current branch."""
    result = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()

def check_if_branch_pushed(branch_name):
    """Check if the branch has been pushed to the remote."""
    result = subprocess.run(
        ["git", "ls-remote", "--heads", "origin", branch_name],
        capture_output=True,
        text=True,
    )
    return bool(result.stdout.strip())

def create_pull_request(branch_name, title, body):
    """Create a pull request using the GitHub CLI."""
    # Check if GitHub CLI is installed
    result = subprocess.run(
        ["gh", "--version"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("Error: GitHub CLI (gh) is not installed.")
        print("Please install it from https://cli.github.com/")
        return False
    
    # Create the pull request
    print(f"Creating pull request for branch {branch_name}...")
    result = subprocess.run(
        ["gh", "pr", "create", "--base", "main", "--head", branch_name, "--title", title, "--body", body],
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        print(f"Error creating pull request: {result.stderr}")
        return False
    
    print(result.stdout)
    
    # Extract PR number from URL
    pr_url = result.stdout.strip()
    pr_number_match = re.search(r'/pull/(\d+)', pr_url)
    if pr_number_match:
        return pr_number_match.group(1)
    
    return None

def wait_for_ci_checks(pr_number):
    """Wait for CI checks to complete."""
    print(f"Waiting for CI checks to complete for PR #{pr_number}...")
    
    max_attempts = 30
    for attempt in range(max_attempts):
        result = subprocess.run(
            ["gh", "pr", "checks", pr_number],
            capture_output=True,
            text=True,
        )
        
        if "All checks were successful" in result.stdout:
            print("All CI checks passed!")
            return True
        
        if attempt < max_attempts - 1:
            print(f"CI checks still running. Waiting 30 seconds... ({attempt + 1}/{max_attempts})")
            time.sleep(30)
    
    print("Timed out waiting for CI checks to complete.")
    return False

def approve_pull_request(pr_number):
    """Approve the pull request."""
    print(f"Approving PR #{pr_number}...")
    result = subprocess.run(
        ["gh", "pr", "review", pr_number, "--approve"],
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        print(f"Error approving pull request: {result.stderr}")
        return False
    
    print("Pull request approved!")
    return True

def merge_pull_request(pr_number):
    """Merge the pull request."""
    print(f"Merging PR #{pr_number}...")
    result = subprocess.run(
        ["gh", "pr", "merge", pr_number, "--squash"],
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        print(f"Error merging pull request: {result.stderr}")
        return False
    
    print("Pull request merged!")
    return True

def cleanup_local_branch(branch_name):
    """Cleanup the local branch after merging."""
    print("Switching to main branch...")
    subprocess.run(
        ["git", "checkout", "main"],
        capture_output=True,
        text=True,
        check=True,
    )
    
    print("Pulling latest changes...")
    subprocess.run(
        ["git", "pull"],
        capture_output=True,
        text=True,
        check=True,
    )
    
    print(f"Deleting local branch {branch_name}...")
    subprocess.run(
        ["git", "branch", "-D", branch_name],
        capture_output=True,
        text=True,
    )
    
    print("Local cleanup complete!")
    return True

def main():
    """Main function to automate the PR creation, review, merge, and cleanup process."""
    parser = argparse.ArgumentParser(description="Automate the PR creation, review, merge, and cleanup process.")
    parser.add_argument("--title", help="Pull request title")
    parser.add_argument("--body", help="Pull request body")
    parser.add_argument("--skip-ci", action="store_true", help="Skip waiting for CI checks")
    args = parser.parse_args()
    
    # Get the current branch
    branch_name = get_current_branch()
    
    # Skip if on main branch
    if branch_name == "main":
        print("Error: You are on the main branch. Please switch to a feature branch.")
        return 1
    
    # Check if branch has been pushed
    if not check_if_branch_pushed(branch_name):
        print(f"Error: Branch {branch_name} has not been pushed to the remote.")
        print("Please push your branch first:")
        print(f"  git push -u origin {branch_name}")
        return 1
    
    # Get PR title and body if not provided
    pr_title = args.title
    if not pr_title:
        pr_title = input("Enter PR title: ")
    
    pr_body = args.body
    if not pr_body:
        print("Enter PR body (end with Ctrl+D on a new line):")
        pr_body_lines = []
        try:
            while True:
                line = input()
                pr_body_lines.append(line)
        except EOFError:
            pr_body = "\n".join(pr_body_lines)
    
    # Create the pull request
    pr_number = create_pull_request(branch_name, pr_title, pr_body)
    if not pr_number:
        return 1
    
    # Wait for CI checks to complete
    if not args.skip_ci and not wait_for_ci_checks(pr_number):
        print("CI checks failed or timed out. Please check the PR on GitHub.")
        return 1
    
    # Approve the pull request
    if not approve_pull_request(pr_number):
        return 1
    
    # Merge the pull request
    if not merge_pull_request(pr_number):
        return 1
    
    # Cleanup the local branch
    if not cleanup_local_branch(branch_name):
        return 1
    
    print("\nFeature development workflow completed successfully!")
    print("The feature has been merged into main and the local branch has been cleaned up.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
