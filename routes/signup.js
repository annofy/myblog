const fs = require('fs'),
  path = require('path'),
  sha1 = require('sha1'),
  express = require('express'),
  config = require('config-lite'),
  router = express.Router(),
  UserModel = require('../models/users'),
  formidable = require('formidable'),
  checkNotLogin = require('../middlewares/check').checkNotLogin;

router.get('/', checkNotLogin, function (req, res, next) {
  res.render('signup', {
    title: '注册 | ' + config.author
  });
  next();
});

router.post('/', checkNotLogin, function (req, res, next) {
  let form = formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../', 'public/img/upload/user_pic');
  form.keepExtensions = true
  let name = req.fields.name,
    bio = req.fields.bio,
    avatar = req.files.avatar.path.split(path.sep).pop(),
    password = req.fields.password,
    repassword = req.fields.repassword,
    code = req.fields.code;

  // 校验参数
  try {
    if (!(name.length >= 1 && name.length <= 10)) {
      throw new Error('名字请限制在1-10个字符');
    }
    if (!(bio.length >= 1 && bio.length <= 30)) {
      throw new Error('个人简介请限制在 1-30 个字符');
    }
    if (!req.files.avatar.name && req.files.avatar.type.indexOf('image') != -1) {
      throw new Error('缺少头像');
    }
    if (password.length < 6) {
      throw new Error('密码至少 6 个字符');
    }
    if (password !== repassword) {
      throw new Error('两次输入密码不一致');
    }
    // FIXME 待验证
    if (code !== 'zhenglongfan') {
      throw new Error('无效邀请码');
    }
  } catch (e) {
    // 注册失败删除上传文件
    fs.unlink(req.files.avatar.path);
    req.flash('error', e.message);
    return res.redirect('/signup')
  }
  // 密码加密
  password = sha1(password);

  // 组织用户信息保存到数据库
  let user = {
    name: name,
    password: password,
    bio: bio,
    avatar: avatar,
    code: code,
    role: "5871462fa2a674ed4034d120"
  };
  UserModel.create(user).then(function (result) {
    // result为插入 数据库后的返回值
    user = result.ops[0];
    delete user.password;
    req.session.user = user;
    // 写入flush
    req.flash('success', '注册成功');
    // 跳转到首页
    res.redirect('/')
  }).catch(function (e) {
    if (e.message.match(/11000 E11000 duplicate key/g)) {
      req.flash('error', '用户名被占用');
      return res.redirect('/signup')
    }
    next(e)
  })
});

module.exports = router;
