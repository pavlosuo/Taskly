const isProd = process.env.NODE_ENV === "production";

const config = {
  plugins: [
    "@tailwindcss/postcss",
    [
      "postcss-preset-env",
      {
        stage: 2,
        autoprefixer: { grid: true },
        features: {
          "nesting-rules": true,
          "cascade-layers": true,
        },
      },
    ],
    "postcss-sort-media-queries",
    isProd && [
      "cssnano",
      {
        preset: [
          "default",
          {
            discardComments: { removeAll: true },
            autoprefixer: false,
            zindex: false,
            reduceIdents: false,
            mergeIdents: false,
            calc: { precision: 5 },
            mergeLonghand: true,
            mergeRules: true,
            minifyGradients: true,
            minifyFontValues: true,
            discardUnused: false,
            normalizeWhitespace: true,
          },
        ],
      },
    ],
    ["postcss-reporter", { clearReportedMessages: true }],
  ].filter(Boolean),
};

export default config;
