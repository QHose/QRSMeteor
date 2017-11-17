# reveal

The HTML presentation framework

[![NPM version](https://badge.fury.io/js/reveal.png)](http://badge.fury.io/js/reveal)

## Installation

    npm install reveal

## Usage

index.jade (to be compiled using jade)

```jade
doctype html
html(lang="en")
  head
    meta(charset="utf-8")
    title reveal.js - The HTML Presentation Framework

    meta(name="description" content="A framework for easily creating presentations")
    meta(name="author" content="Hakim El Hattab")

    meta(name="apple-mobile-web-app-capable" content="yes")
    meta(name="apple-mobile-web-app-status-bar-style" content="black-translucent")

    meta(name="viewport" content="width=device-width,"
                                +"initial-scale=1.0,"
                                +"maximum-scale=1.0,"
                                +"user-scalable=no")

    link(rel="stylesheet" href="index.css")

  body
    .reveal
      // Any section element inside of this container is displayed as a slide
      .slides
        section
          h1 Reveal.js
        section
            h1 THE END
            h2 BY Hakim El Hattab / hakim.se
    script(src="/index.js")
```

index.js (to be compiled using browserify)

```js
var Reveal = require('./reveal.js');
// Full list of configuration options available here:
// https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
  controls: true,
  progress: true,
  history: true,
  center: true,
  // default/cube/page/concave/zoom/linear/fade/none
  transition: 'none',
});
```

index.less (to be compiled using less-fixed)

```less
@import (npm) "reveal";
@import (npm) "reveal/theme/default";
/* Custom styles here */
```


## License

  MIT