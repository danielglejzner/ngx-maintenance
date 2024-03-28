/* eslint-disable */
const esModules = ['@angular', 'tslib', 'rxjs'];
export default {
  displayName: 'migration-to-standard',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': ['jest-preset-angular', { tsconfig: '<rootDir>/tsconfig.spec.json', }],
  },
  transformIgnorePatterns: [
    `node_modules/(?!@angular|@ngneat/spectator|array-move|lodash-es)`,
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/migration-to-standard',
};
