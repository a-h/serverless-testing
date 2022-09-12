import type {Config} from 'jest';

const config: Config = {
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "esbuild-jest"
  }
};

export default config;
