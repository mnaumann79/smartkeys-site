#!/bin/bash

# Bash script to test error handling endpoints using curl
# Importance: Provides a reliable way to test error handling without Node.js version dependencies

BASE_URL=${BASE_URL:-"http://localhost:3000"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error types to test
error_types=("validation" "authentication" "authorization" "database" "stripe" "license" "unexpected" "async")

# Function to test a single error type
test_error() {
    local error_type=$1
    echo -e "\n${BLUE}🧪 Testing ${error_type} error...${NC}"
    
    # Make the API call
    response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/test/errors" \
        -H "Content-Type: application/json" \
        -d "{\"errorType\": \"${error_type}\"}")
    
    # Extract status code (last line) and response body
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    echo -e "${YELLOW}📊 Status: ${status_code}${NC}"
    echo -e "${YELLOW}📄 Response:${NC}"
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    
    # Return status for summary
    if [ "$status_code" -ge 400 ]; then
        echo -e "${RED}❌ ${error_type}: ${status_code}${NC}"
        return 1
    else
        echo -e "${GREEN}✅ ${error_type}: ${status_code}${NC}"
        return 0
    fi
}

# Function to test all errors
test_all_errors() {
    echo -e "${BLUE}🚀 Starting error handling tests...${NC}\n"
    
    local passed=0
    local failed=0
    
    for error_type in "${error_types[@]}"; do
        if test_error "$error_type"; then
            ((passed++))
        else
            ((failed++))
        fi
        # Small delay between requests
        sleep 0.2
    done
    
    echo -e "\n${BLUE}📋 Test Summary:${NC}"
    echo -e "${BLUE}================${NC}"
    echo -e "${GREEN}✅ Passed: ${passed}${NC}"
    echo -e "${RED}❌ Failed: ${failed}${NC}"
    echo -e "\n${GREEN}✨ Error handling tests completed!${NC}"
}

# Function to get endpoint info
test_endpoint_info() {
    echo -e "${BLUE}🔍 Getting endpoint information...${NC}\n"
    
    response=$(curl -s "${BASE_URL}/api/test/errors")
    echo -e "${YELLOW}📄 Endpoint Info:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Function to test specific error type
test_specific_error() {
    local error_type=$1
    
    # Check if error type is valid
    local valid=false
    for type in "${error_types[@]}"; do
        if [ "$type" = "$error_type" ]; then
            valid=true
            break
        fi
    done
    
    if [ "$valid" = false ]; then
        echo -e "${RED}❌ Invalid error type: ${error_type}${NC}"
        echo -e "${YELLOW}Available types: ${error_types[*]}${NC}"
        exit 1
    fi
    
    test_error "$error_type"
}

# Function to show help
show_help() {
    echo "
Error Handling Test Script (curl version)

Usage:
  bash scripts/test-errors-curl.sh [options]

Options:
  --info, -i     Get endpoint information
  --all, -a      Test all error types (default)
  --type <type>  Test specific error type
  --help, -h     Show this help message

Examples:
  bash scripts/test-errors-curl.sh --all
  bash scripts/test-errors-curl.sh --type validation
  bash scripts/test-errors-curl.sh --info

Requirements:
  - curl (usually pre-installed)
  - jq (optional, for pretty JSON output)
  - Development server running on ${BASE_URL}
"
}

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ Error: curl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if server is running
if ! curl -s "${BASE_URL}/api/test/errors" &> /dev/null; then
    echo -e "${RED}❌ Error: Cannot connect to ${BASE_URL}${NC}"
    echo -e "${YELLOW}Make sure your development server is running:${NC}"
    echo -e "  pnpm dev"
    exit 1
fi

# Parse command line arguments
case "${1:---all}" in
    --help|-h)
        show_help
        ;;
    --info|-i)
        test_endpoint_info
        ;;
    --type)
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error type not specified${NC}"
            exit 1
        fi
        test_specific_error "$2"
        ;;
    --all|-a|"")
        test_all_errors
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        show_help
        exit 1
        ;;
esac
