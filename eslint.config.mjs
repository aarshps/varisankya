import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // We intentionally hydrate client state from localStorage, subscribe to
      // Firestore, and fetch-on-mount inside effects — the synchronous setState
      // calls those patterns require are exactly what this experimental rule
      // flags. Disable it rather than contort correct subscribe/hydrate code.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
