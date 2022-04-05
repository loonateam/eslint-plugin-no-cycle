# eslint-plugin-no-cycle

## Description

Based on - https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md

Works with ts aliases

## Install

### yarn
``
yarn add -D https://github.com/loonateam/eslint-plugin-no-cycle.git
``

### npm
``
npm i --save-dev https://github.com/loonateam/eslint-plugin-no-cycle.git
``

## Usage

Add `no-cycle` to the plugins section of your `.eslintrc` configuration
file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["no-cycle"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "no-cycle/no-cycle": "error",
  }
}
```

or start with the recommended rule set:

```json
{
  "extends": ["plugin:no-cycle/recommended"]
}
```

## Rules

| rule                                                     | description                                                                      | recommended | 
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------- |
| no-cycle                     | Ensures that there is no resolvable path back to this module via its dependencies.                     | `error`  |
