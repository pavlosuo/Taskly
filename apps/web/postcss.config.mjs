const isProd = process.env.NODE_ENV === "production";
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    ...(isProd && {
      "postcss-sort-media-queries": { sort: "mobile-first" },
      cssnano: {
        preset: [
          "default",
          {
            discardComments: { removeAll: true },
            zindex: false,
            reduceIdents: false,
            mergeIdents: false,
            discardUnused: false,
            normalizeWhitespace: true,
            calc: { precision: 5 },
            colormin: true,
            minifyGradients: true,
            minifyFontValues: true,
            mergeLonghand: true,
            mergeRules: true,
          },
        ],
      },
    }),
  },
};

export default config;
