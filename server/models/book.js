require('./../config/config');

const mongoose = require('mongoose');
const {ObjectID} = require('mongodb');
const moment = require('moment');

var BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  orginalTitle: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  autors: [{
    authorId: mongoose.Schema.Types.ObjectId,
  }],
  path: {
    type: String,
    trim: true
  },
  rate: {
    type: Number
  },
  readed: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  modDate: {
    type: Date,
    default: null
  },
  addDate: {
    type: Date,
    default: moment()
  },
  source: {
    type: String,
    trim: true
  },
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

var Book = mongoose.model('Book', BookSchema);

module.exports = {Book};
