let express = require('express'),
  router = express.Router(),
  config = require('config-lite'),
  ArticleModel = require('../models/articles'),
  CategoryModel = require('../models/category'),
  check = require('../middlewares/check');

router.get('/', function (req, res, next) {
  Promise.all([
    ArticleModel.getArticles(),
    CategoryModel.getCategories()
  ]).then(function (results) {
    let articles = results[0];
    let categories = results[1];
    res.render('articles', {
      title: '文章列表 | ' + config.author,
      articles: articles,
      categories: categories
    });
  }).catch(next)
});

router.post('/create', function (req, res, next) {

  let author = req.session.user._id,
    title = req.fields.title,
    category = req.fields.category,
    content = req.fields.content,
    description = req.fields.description,
    newCategory = req.fields.newCategory;

  try {
    if (!title.length) {
      throw new Error('标题为空');
    }
    if (!category.length) {
      throw new Error('选择分类');
    }
    if (!content.length) {
      throw new Error('请填写文章内容');
    }
    if (newCategory.length != 0) {
      // 创建新分类
      let categoryObject = {
        name: newCategory,
        description: '',
        icon: ''
      };
      CategoryModel
        .create(categoryObject)
        .then(function (result) {
          category = result.ops[0]._id;
          let article = {
            author: author,
            title: title,
            category: category,
            content: content,
            description: description
          };
          ArticleModel
            .create(article)
            .then(function (result) {
              // 此article为插入数据库后的值
              article = result.ops[0];
              req.flash('success', '发表成功');
              res.redirect(`/articles/detail/${ article._id }`);
            })
            .catch(next);
        });
    } else {
      let article = {
        author: author,
        title: title,
        category: category,
        content: content,
        description: description
      };
      ArticleModel
        .create(article)
        .then(function (result) {
          // 此article为插入数据库后的值
          article = result.ops[0];
          req.flash('success', '发表成功');
          res.redirect(`/articles/detail/${ article._id }`);
        })
        .catch(next);
    }
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/articles/create');
  }
});

router.get('/detail/:id', function (req, res, next) {
  let articleId = req.params.id;
  ArticleModel
    .getArticleById(articleId)
    .then(function (result) {
      let article = result;
      if (!article) {
        throw new Error('文章不存在');
      }
      res.render('article', {
        title: article.title + ' | ' + config.author,
        article: article
      });
    }).catch(next);
});

router.get('/create', check.checkLogin, function (req, res, next) {
  CategoryModel
    .getCategories()
    .then(function (categories) {
      res.render('create', {
        title: '创建文章 | ' + config.author,
        categories: categories
      });
    }).catch(next);
});

router.get('/delete', check.checkLogin, function (req, res, next) {
  let articleId = req.query.id;

  ArticleModel
    .delArticleById(articleId)
    .then(function () {
      req.flash('success', '删除文章成功');

      res.redirect('/articles');
    })
    .catch(next);
});

router.get('/edit/:id', check.checkLogin, function (req, res, next) {
  let articleId = req.params.id;

  Promise.all([
    ArticleModel.getArticleById(articleId),
    CategoryModel.getCategories()
  ]).then(function (results) {
    let article = results[0],
      categories = results[1];

    res.render('edit', {
      title: `正在编辑文章(${ article.title }) | ${ config.author }`,
      article: article,
      categories: categories
    });
  }).catch(next);

});

router.post('/edit', check.checkLogin, function (req, res, next) {
  let articleId = req.fields.id,
    title = req.fields.title,
    description = req.fields.description,
    categroy = req.fields.categories,
    content = req.fields.content,
    article = {title, description, categroy, content};

  //fixme 如果为空的情况，需要先查询，后生成article对象，若为空则使用原来的数据

  ArticleModel
    .updatePostById(articleId, article)
    .then(function () {
      req.flash('success', '修改文章成功');
      res.redirect(`/articles/detail/${ articleId }`)
    })
    .catch(next);

});

module.exports = router;
