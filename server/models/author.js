require('./../config/config');

const mongoose = require('mongoose');
const moment = require('moment');

var AuthorSchema = new mongoose.Schema({
  firstNames: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  names: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  addDate: {
    type: Date,
    default: moment()
  },
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
}, {
    usePushEach: true
});

AuthorSchema.statics.findByUser = function (_creator) {};

var Author = mongoose.model('Author', AuthorSchema);
module.exports = {Author};
