require('./config/config');

const _ = require('lodash')
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const moment = require('moment');

const {mongoose} = require('./db/mongoose');
const {Book} = require('./models/book');
const {Author} = require('./models/author');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// add new book
app.post('/books', authenticate, async (req, res) => {
  const book = new Book({
    title: req.body.title,
    orginalTitle: req.body.orginalTitle,
    authors: req.body.authors,
    path: req.body.path,
    rate: req.body.rate,
    readed: req.body.readed,
    description: req.body.description,
    notes: req.body.notes,
    modDate: moment(),
    source: req.body.source,
    _creator: req.user._id
  });

  try {
    const doc = await book.save();
    res.send(doc);
  } catch (e) {
    res.status(400).send(e);
    console.log(e);
  }
});

// list of user's books
app.get('/books', authenticate, async (req, res) => {
  try {
    books = await Book.find({_creator: req.user._id});
    res.send({books});
  } catch (e) {
    res.status(400).send(e);
  }
});

// get book by id
app.get('/books/:id', authenticate, async (req, res) => {
  var id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  const book = await Book.findOne({
    _id: id,
    _creator: req.user._id
  });

  try {
    if (!book) {
        return res.status(404).send();
    }
    res.send({book});
  } catch (e) {
    res.status(400).send();
  }
});

// delete book by id
app.delete('/books/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  try {
    const doc = await Book.findOneAndRemove({
        _id: id,
        _creator: req.user._id
      })
    if (!doc) {
        return res.status(404).send();
    }
    res.send({doc});
  } catch (e) {
    res.status(400).send();
  }
});

// update book by id
app.patch('/books/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  var body = _.pick(req.body, [
    'title',
    'orginalTitle',
    'autors',
    'path',
    'rate',
    'readed',
    'description',
    'notes',
    'source'
  ]);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  try {
    const modDate = moment().format()
    const modDateObj = {modDate: modDate};
    body = _.assign(body, modDateObj);
    const book = await Book.findOneAndUpdate({
          _id: id,
          _creator: req.user._id
    }, {$set: body}, {new: true});
    if(!book){
      return res.status(404).send();
    }
    res.send({book});
  } catch (e) {
    res.status(400).send();
  }
});

// USER *******************************************

app.post('/users', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);
    const token = await user.generateAuthToken();
    await user.save()
    res.header('x-auth', token).send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.delete('/users/me/token', authenticate, async (req, res) => {
  try {
    await req.user.removeToken(req.token)
    res.status(200).send();
  } catch (e) {
    res.status(400).send();
  }
});

// LISTEN *****************************************

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = {app};
