let mongolass = require('../db/dbconfig');
let Mongolass = require('mongolass');

let User = mongolass.model('User', {
    name: { type: 'string' },
    password: { type: 'string' },
    avatar: { type: 'string' },
    code: { type: 'string' },
    bio: { type: 'string' },
    role: { type: Mongolass.Types.ObjectId },
});
// 根据用户名找到用户，同事设置了name为唯一索引
User.index({name: 1}, {unique: true}).exec();
module.exports = {
    // 注册一个用户
    create: function(user) {
        return User.create(user).exec()
    },
    getUserByName: function(name) {
        return User
            .findOne({ name: name })
            .populate({ path: 'role', model: 'Roles'})
            .addCreateAt()
            .exec();
    },
    getUserByUserId: function(userId) {
        return User
            .findOne({ _id: userId })
            .populate({ path: 'role', model: 'Roles'})
            .addCreateAt()
            .exec();
    },
    updateUserByUserId: function(userId, user) {
        return User
            .update({ _id: userId }, {$set: user})
            .exec();
    },
    getUsers: function() {
        return User
            .find()
            .populate({ path: 'role', model: 'Roles'})
            .addCreateAt()
            .exec();
    },
    removeUser: function(userId) {
        // fixme 删除用户及用户下的所有文章
        return User
            .remove({ _id: userId })
            .exec();
    }
};