const express = require('express');
const models = require('../models');
const Redirect = require('../middlewares/redirect');
const getSlug = require('speakingurl');

module.exports = {
  registerRouter() {
    const router = express.Router();

    router.get('/', this.index);
    router.get('/new', Redirect.ifNotLoggedIn('/login'), this.new);
    router.post('/', Redirect.ifNotLoggedIn('/login'), this.create);
    router.get('/:username/:slug', this.show);
    router.get('/:username/:slug/edit',
                Redirect.ifNotLoggedIn('/login'),
                Redirect.ifNotAuthorized('/posts'),
                this.edit
              );
    router.put('/:username/:slug',
                Redirect.ifNotLoggedIn('/login'),
                Redirect.ifNotAuthorized('/posts'),
                this.update
              );
    router.delete('/:username/:slug',
                   Redirect.ifNotLoggedIn('/login'),
                   Redirect.ifNotAuthorized('/posts'),
                   this.delete
                  );

    return router;
  },
  index(req, res) {
    models.Post.findAll({
      include: [{model: models.User}]
    }).then((allPosts) => {
      res.render('posts', { allPosts });
    });
  },
  new(req, res) {
    res.render('posts/new');
  },
  create(req, res) {
    // using the association
    req.user.createPost({
      slug: getSlug(req.body.title.toLowerCase()),
      title: req.body.title.toLowerCase(),
      body: req.body.body,
    }).then((post) => {
      res.redirect(`/posts/${req.user.username}/${post.slug}`);
    }).catch(() => {
      res.render('posts/new');
    });

    // Without the sequelize association
    /*
    models.Post.create({
      userId: req.user.id,
      slug: getSlug(req.body.title.toLowerCase()),
      title: req.body.title.toLowerCase(),
      body: req.body.body,
    }).then((post) => {
      res.redirect(`/posts/${req.user.username}/${post.slug}`);
    }).catch(() => {
      res.render('posts/new');
    });
    */
  },
  show(req, res) {
    models.Post.findOne({
      where: {
        username: req.params.username,
        slug: req.params.slug,
      },
    }).then((post) =>
      (post ? res.render('posts/single', { post }) : res.redirect('/posts'))
    );
  },
  edit(req, res) {
    models.Post.findOne({
      where: {
        username: req.params.username,
        slug: req.params.slug,
      },
    }).then((post) =>
      (post ? res.render('posts/edit', { post }) : res.redirect('/posts'))
    );
  },
  update(req, res) {
    models.Post.update({
      title: req.body.title.toLowerCase(),
      slug: getSlug(req.body.title.toLowerCase()),
      body: req.body.body,
    }, {
      where: {
        username: req.params.username,
        slug: req.params.slug,
      },
    }).then((post) => {
      res.redirect(`/posts/${post.username}/${post.title}`);
    });
  },
  delete(req, res) {
    models.Post.destroy({
      where: {
        username: req.params.username,
        slug: req.params.slug,
      },
    }).then(() => {
      res.redirect('/posts');
    });
  },
};
