#!/bin/bash

if [ -z "$1" ]; then
    echo "Please provide the Cognito Client ID"
    exit 0
fi

aws cognito-idp --region us-east-1 sign-up --client-id $1 --username test@test.com --password 123456 --user-attributes Name=name,Value=Testuser