import { createFunction } from 'twing';
const returnNull = [
  (_executionContext, q) => {
    return Promise.resolve(null);
  },
  [
    { name: 'q', defaultValue: '' }
  ]
];
export default [
  createFunction('attach_library', ...returnNull),
];
