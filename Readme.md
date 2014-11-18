# mountain

[![Build Status](https://travis-ci.org/nowk/mountain-js.svg?branch=master)](https://travis-ci.org/nowk/mountain-js)
<!-- [![Code Climate](https://codeclimate.com/github/nowk/mountain-js.png)](https://codeclimate.com/github/nowk/mountain-js) -->
[![David DM](https://david-dm.org/nowk/mountain-js.png)](https://david-dm.org/nowk/mountain-js)

Simple routing for Koa


## Example

    var posts = route("GET", "/posts", function *(next) {
      this.body = "got posts!";
    });

    var postComment = route("POST", "/posts/:id/comments", function *(next) {
      var postId = this.params.id;
      this.body = "commented on a post";
    });

    var app = koa();
    app.use(posts);
    app.use(postComment);
    app.listen();

## License

MIT

