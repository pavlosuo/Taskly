const config = {
  plugins: [
    "@tailwindcss/postcss",
    "postcss-import",
    ["autoprefixer", { grid: true }],
    [
      "postcss-combine-duplicated-selectors",
      {
        removeDuplicatedProperties: true,
      },
    ],
    [
      "postcss-preset-env",
      {
        stage: 2,
        autoprefixer: { grid: true },
        features: {
          "nesting-rules": true,
        },
      },
    ],
    [
      "cssnano",
      {
        preset: [
          "default",
          {
            discardComments: {
              removeAll: true,
            },
          },
        ],
      },
    ],
    [
      "postcss-reporter",
      {
        clearReportedMessages: true,
      },
    ],
    "postcss-sort-media-queries",
  ],
};

export default config;