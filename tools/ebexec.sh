#!/bin/bash

cmd="$@"
echo ${cmd}

# this doesn't actually work
eb ssh -c "sudo docker exec -it $(docker ps -lq) ${cmd}"
