#!/bin/bash
set -e

for flow in .maestro/flows/*.yaml; do
  maestro test "$flow"
done
