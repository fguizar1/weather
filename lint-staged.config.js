export default {
  '*.{js,ts}': ['eslint --fix', 'prettier --write'],
  '*.test.{js,ts}': ['vitest related --run'],
  '*.{json,css,md}': ['prettier --write'],
};
