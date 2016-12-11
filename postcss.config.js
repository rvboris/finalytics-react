module.exports = () => ({
  plugins: [
    require('stylelint')(),
    require('postcss-flexbox')(),
    require('rucksack-css'),
    require('postcss-cssnext'),
    require('css-mqpacker')(),
    require('postcss-reporter')({ clearMessages: true }),
  ],
});
