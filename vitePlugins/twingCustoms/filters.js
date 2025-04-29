import {  createFilter } from 'twing';
export default [
    createFilter(
        'clean_class',
        async function (_executionContext, c) {
          return c.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^[0-9]+/, '').toLowerCase();
        },
        [
          { name: 'c', defaultValue: '' },
        ]
      ),
      createFilter('t', function (t) { return Promise.resolve(t); })
]