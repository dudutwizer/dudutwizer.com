#!/bin/bash

# If a command fails then the deploy stops
set -e

printf "\033[0;32mDeploying updates to GitHub...\033[0m\n"

# Build the project with a specific theme
hugo

# Add changes to Git
git add .

# Commit changes
msg="Rebuilding site $(date +%D-%T)"
if [ -n "$*" ]; then
	msg="$*"
fi
git commit -m "$msg"

git pull

# Push source and build repos
git push origin main
