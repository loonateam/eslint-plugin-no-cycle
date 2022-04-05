const noAliasRule = require('./lib/index');

module.exports = {
  meta: noAliasRule.meta,
  rules: noAliasRule.rules,
  configs: {
    recommended: {
        plugins: ['no-cycle'],
        rules: {
          'no-cycle/no-cycle': 'error',
        },
    },
},
}
