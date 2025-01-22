#!/bin/bash
cd /var/app/staging
sudo -u webapp mkdir node_modules
sudo -u webapp npm install --omit=dev

# References for Fix
# https://stackoverflow.com/questions/71589818/why-npm-install-failed-only-in-elasticbeanstalk/74852276#74852276
# https://github.com/lovell/sharp/issues/3221