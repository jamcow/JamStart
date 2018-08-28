# JamStart

Node, Yarn, Gulp, Sass, Jekyll

## Requirements

- Node: [nodejs.org](https://nodejs.org/) - latest LTS release is a good choice
- Yarn: [yarnpkg.com](https://yarnpkg.com/en/docs/install) - latest stable release is a good choice. Why Yarn? Control over exact npm module versions and speedy
- Ruby (optional): [ruby-lang.org](https://www.ruby-lang.org/en/downloads/) - used by Jekyll

## Setup

1. Configure the paths in `gulpfile.js`
2. Navigate to folder and run command `yarn` (this installs the packages listed in package.json)
3. If all is successful, run one of the gulp tasks listed in `gulpfile.js`.
    - Run as a proxy (with existing site)
        `gulp sass --site www.sitename.test`
    - Run a Jekyll build (generate a static site)
        `gulp sass`

### What's included

- **Sourcemaps** - Specificity issues and development made easier. Corrected to linking to correct file (originally caused by using combo of gulp-sourcemaps and gulp-autoprefixer because nested files and modified line numbers weren't correctly matched).
- **Autoprefixer** - Analytics are studied and supported browsers are added to package.json, helps to ensure we output supported features, in addition appropriate manual fallbacks should be added.
- **Media Queries** - Sass mixin using `include-media` to use any values generated or site variable.
- **Normalize** - Helpful utility `normalize-scss` but in the future looking at reducing the amount of rules it generates, and moving it to the top of an optimised CSS file.
- **Optimised and minified** - Sass is compiled to optimised CSS, and because we use BEM it's pretty safe to allow rule restructuring too to save a tiny bit more, which works great when gzip'd.

We've integrated `include-media` and `normalize-scss` and they're linked to their respective folders within `node_modules`. We could configure `dep-linker` to include these files within our Sass src files automatically, however, because we only run in Development mode, there didn't seem much point.

## Problems

### Node

If "_Node Sass does not yet support your current environment: OS X 64-bit with Unsupported runtime_":

- try removing node_modules content and `yarn install` again, because yarn seems to rebuild node-sass if it needs, old fix was `npm rebuild node-sass`
- else can try forcing it: `yarn install --force`
- also try `yarn install –check-files`

### Yarn

- if Yarn issues warnings about "unmet peer dependency" see [issue 4595](https://github.com/yarnpkg/yarn/issues/4595)

### Jekyll

- Jekyll may need `gem install tzinfo` and `gem install tzinfo-data` (for time zone capabilities), especially if on 64bit Windows

## Updating packages

`yarn upgrade-interactive`
or
`yarn upgrade-interactive --latest` (get very latest, possibly breaking)

### Documentation

- Need to re-add Sassdocs (not keen on lots of examples/markup etc being within the Sass, but it does make a lot of sense for functions/mixins).
- [Docz](https://www.docz.site/) looks really good.

## Future / To Do's

Configure/Extend/Experiment

- Might need to curb cssnext some more, to not be too overzealous with next gen CSS like [CSS variables](https://github.com/MoOx/postcss-cssnext/issues/186#issuecomment-269934734)
- Look into cssnext options more and disable anything that can cause us issues
- Write it well, modularly, using @supports and fallbacks, using linters, and ensure it's all compatible, accessibile, readable, usable.
- Look into `parker` and `gulp-parker2`
- WCAG 2.x
- Heydon's amazing [inclusive components](https://inclusive-components.design)
