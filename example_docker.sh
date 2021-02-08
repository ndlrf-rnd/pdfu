#!/bin/bash

ls -l "$(pwd)/src/__tests__/data"
docker run -it --mount "type=bind,source=$(pwd)/src/__tests__/data,target=/data" pdfu:latest --  --optimize -p 1-13

ls -l "$(pwd)/src/__tests__/data"
