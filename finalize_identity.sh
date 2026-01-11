#!/bin/sh

# Standardize names and emails across ALL branches
git filter-branch -f --env-filter '
OLD_EMAIL_1="ethanchiouu@gmail.com"
OLD_EMAIL_2="147359245+ethanchiou@users.noreply.github.com"
CORRECT_NAME="ethanchiou"
CORRECT_EMAIL="ethann.chiou@gmail.com"

# Match by email or the specific "Ethan Chiou" variation
if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL_1" ] || [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL_2" ] || [ "$GIT_COMMITTER_NAME" = "Ethan Chiou" ] || [ "$GIT_COMMITTER_NAME" = "ethanchiou" ]; then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL_1" ] || [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL_2" ] || [ "$GIT_AUTHOR_NAME" = "Ethan Chiou" ] || [ "$GIT_AUTHOR_NAME" = "ethanchiou" ]; then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --all

# Purge backups so tools don't see old commits
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
