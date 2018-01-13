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
const {sendToDbx} = require('./utils/upload');

let app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// add new book
app.post('/books', authenticate, async (req, res) => {
  // let filesObj = _.pick(req.body, [
  //   'files'
  // ]);
  // let files = _.map(filesObj, 'files');
  // let uploadedFiles = files.map(
  //   (file) => sendToDbx(file.file, file.name, file.extension)
  // );

  const book = new Book({
    title: req.body.title,
    orginalTitle: req.body.orginalTitle,
    authors: req.body.authors,
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
    res.status(400).send();
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
  let id = req.params.id;
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
  let body = _.pick(req.body, [
    'title',
    'orginalTitle',
    'autors',
    'rate',
    'readed',
    'description',
    'notes',
    'source'
  ]);
  // let filesObj = _.pick(req.body, [
  //   'files'
  // ]);
  // let files = _.map(filesObj, 'files');

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
    // let uploadedFiles = files.map(
    //   (file) => sendToDbx(file.file, file.name, file.extension)
    // );
    if(!book){
      return res.status(404).send();
    }
    res.send({book});
  } catch (e) {
    res.status(400).send();
  }
});

// AUTHOR *****************************************

app.post('/author', authenticate, async (req, res) => {
  const author = new Author({
    firstNames: req.body.firstNames,
    names: req.body.names,
    addDate: moment(),
    _creator: req.user._id
  });

  try {
    const doc = await author.save();
    res.send(doc);
  } catch (e) {
    res.status(400).send();
  }
});

app.get('/author', authenticate, async (req, res) => {
  try {
    authors = await Author.find({_creator: req.user._id});
    res.send({authors});
  } catch (e) {
    res.status(400).send(e);
  };
});

app.get('/author/:id', authenticate, async (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  const author = await Author.findOne({
    _id: id,
    _creator: req.user._id
  });

  try {
    if (!author) {
        return res.status(404).send();
    }
    res.send({author});
  } catch (e) {
    res.status(400).send();
  }
});

app.delete('/author/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  try {
    const doc = await Author.findOneAndRemove({
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

app.patch('/author/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  let body = _.pick(req.body, [
    'firstNames',
    'names'
  ]);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }
  try {
    const author = await Author.findOneAndUpdate({
          _id: id,
          _creator: req.user._id
    }, {$set: body}, {new: true});
    if(!author){
      return res.status(404).send();
    }
    res.send({author});
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
