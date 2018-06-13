# JamStart

## Requirements
Install Node:
https://nodejs.org/

Install Yarn:
https://yarnpkg.com
  if Yarn issues warnings about "unmet peer dependency":
  https://github.com/yarnpkg/yarn/issues/4595

## Problems
If "Node Sass does not yet support your current environment: OS X 64-bit with Unsupported runtime"
 try removing node_modules content and "yarn install" again.
 yarn seems to rebuild node-sass if it needs, old fix was "npm rebuild node-sass"
 can try forcing it: "yarn install --force"
 also try "yarn install –check-files"
If 64bit Windows, Jekyll may need "gem install tzinfo" and "gem install tzinfo-data"

To update packages, use:
yarn upgrade-interactive
or
yarn upgrade-interactive --latest
get very latest

# Setup
Configure the paths
Navigate to folder and run command "yarn install"

We're using postcss which means we can use postcss plugins:
postcss-cssnext fixes our issues with sourcemaps not linking to correct file
(originally caused by using combo of gulp-sourcemaps and gulp-autoprefixer because
nested files and modified line numbers were the issue)

## TO DO
Might need to curb cssnext some more, to not be too overzealous with next gen stuff:
 https://github.com/MoOx/postcss-cssnext/issues/186#issuecomment-269934734
 need to look into the options more and disable anything that can cause us issues
 makes sense to write it well, modularly and using @supports, using linters to ensure compatibility
Need to re-add Sassdocs - the default-theme relies on unmaintained dependency
These node_modules need copying and updating into styles "include-media" "normalize-scss"
 configure "dep-linker" to do this automatically or alert if version numbers increase from those stated in Gulp
Check parker and gulp-parker2 - add output to a stats.txt file or something
