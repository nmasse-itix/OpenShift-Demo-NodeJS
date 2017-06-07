#!/bin/bash

# Exit immediately if command returns non-zero status code
set -e

if [ -z "$1" ]; then
  echo "No running instance is given, running our own NodeJS server !"
  node server.js &>/dev/null &
  echo "Waiting for NodeJS to start..."
  sleep 5 # wait for NodeJS to start
  node_pid=$!
  appurl="http://localhost:8080"

  # Do not forget to kill it when finished
  trap "kill $node_pid" EXIT
else
  appurl="$1"
fi

function runtest() {
  url="$1"
  expected="$2"
  ret="$(curl -s -o /dev/null -w "%{http_code}" "$url")"
  if [ "$ret" != "$expected" ]; then
    echo "$url: Got HTTP Status code '$ret' instead of a '$expected' Status code."
    exit 1
  fi
}

runtest "$appurl/" 200
runtest "$appurl/info" 200
runtest "$appurl/blabla" 404

echo "Successfully passed integration tests"
