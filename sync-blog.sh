#!/bin/bash

TARGET=vultr
TARGET_DIR=/var/www/blog/

echo "Syncing local ./dist/ to $TARGET:$TARGET_DIR ..."
rsync -avz --delete ./dist/ "$TARGET:$TARGET_DIR"

echo "Sync complete"
