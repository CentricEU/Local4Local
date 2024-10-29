# Introduction

L4L EU automation repository is set up for adding API and UI testing.
The test are designed to validate the correctness and functionality of the project's features and ensure that the
application meets the required specifications.

## What's included

Here's what's included,

* A standard API&UI project structure that meets the requirements of Playwright framework
* A simple .gitignore for you to build on
* Support for test execution in different environments
* Playwright configuration files for TEST and Prod environments
* UI tests spec file for L4L EU module
* API tests spec file for L4L EU endpoints

## Naming convention to making branches

"[firstLetterOfName+firstTwoLettersOfLastName]_feature"

example: agh_login_tests

## Installation

1. Install node.

* Download the package from `https://nodejs.org/en/download`
* Follow the instruction
* Confirm that node.js and npm are correctly installed by running in terminal following commands,
  `node version`
  `npm version`

2. Pull the repo locally: `git clone `
3. In terminal navigate to the project (`/automation` folder)
4. Run `npm install`
5. Run `npx playwright install`

## Running tests

Tests can be run with the following commands,
To run tests in a headless mode, meaning no browser will open up when running the tests. Results of the tests and test logs will be shown in the
terminal.

```
npx playwright test
```

To run tests with UI Mode

```
npx playwright test --ui
```

To run a single test file

```
npx playwright test login.spec.ts
```

To run the tests in debug mode

```
npx playwright test --debug
```