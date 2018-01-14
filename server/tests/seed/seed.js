const env = require('./../../config/config');

const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Book} = require('./../../models/book');
const {User} = require('./../../models/user');
const {Author} = require('./../../models/author');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

if (!process.env.JWT_SECRET){
  process.env.JWT_SECRET = "sgsadgsadgseewtegsdgb2425"
};

const users = [{
  _id: userOneId,
  email: 'adam@test.pl',
  password: 'userOnePassword',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET)
    .toString()
  }]
}, {
  _id: userTwoId,
  email: 'marian@test.pl',
  password: 'userTwoPassword',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET)
    .toString()
  }]
}]

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo])
  }).then(() => done());
};

const books = [{
  _id: new ObjectID(),
  title: 'First test book',
  orginalTitle: 'First orginal title',
  _creator: userOneId
}, {
  _id: new ObjectID(),
  title: 'Second test book',
  orginalTitle: 'Second orginal title',
  _creator: userTwoId
}];

const populateBooks = (done) => {
  Book.remove({}).then(() => {
    return Book.insertMany(books);
  }).then(() => done());
};

const authors = [{
  _id: new ObjectID(),
  firstNames: 'John R. R.',
  names: 'Tolkien',
  _creator: userOneId
}, {
  _id: new ObjectID(),
  firstNames: 'Robert',
  names: 'Wegner',
  _creator: userTwoId
}];

const pupulateAuthors = (done) => {
  Author.remove({}).then(() => {
    return Author.insertMany(authors);
  }).then(() => done());
};

module.exports = {users, populateUsers, books, populateBooks, authors,
                  pupulateAuthors};
