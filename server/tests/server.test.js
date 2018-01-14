const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
var bodyParser = require('body-parser');

const {app} = require('./../server');
const {Book} = require('./../models/book');
const {User} = require('./../models/user');
const {Author} = require('./../models/author');
const {users, populateUsers, books, populateBooks, authors,
                  pupulateAuthors} = require('./seed/seed')


app.use(bodyParser.json());

beforeEach(populateUsers);
beforeEach(populateBooks);
beforeEach(pupulateAuthors);

describe('****BOOKS****', () => {
  describe('POST /books', () => {
    it('should create a new book', (done) => {
    const book = {
      title: 'Test book title',
      orginalTitle: 'Orginal title',
      _creator: users[0]._id
    };
    request(app)
    .post('/books')
    .set('x-auth', users[0].tokens[0].token)
    .send(book)
    .expect(200)
    .end((err, res) => {
    if(err) {
          return done();
        }
        Book.find(book).then((books) => {
          expect(books.length).toBe(1);
          expect(books[0].title).toBe(book.title);
          expect(books[0].orginalTitle).toBe(book.orginalTitle);
          expect(books[0]._creator).toEqual(book._creator);
          done();
        }).catch((e) => done());
      });
    });

      it('should not create book with invalid data', (done) => {
        request(app)
        .post('/books')
        .set('x-auth', users[0].tokens[0].token)
        .send({})
        .expect(400)
        .end((err, res) => {
          if(err) {
            return done();
          }
          Book.find().then((books) => {
            expect(books.length).toBe(2);
            done();
          }).catch((e) => done());
        });
      });
  });

  describe('GET /books', () => {
    it('should get all books', (done) => {
      request(app)
      .get('/books')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.books.length).toBe(1);
      })
      .end(done)
    });
  });

  describe('GET /todos/:id', () => {
    it('should return book by id', (done) => {
      request(app)
      .get(`/books/${books[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.book.title).toBe(books[0].title);
      })
      .end(done);
    });

      it('should not return book from other user', (done) => {
        request(app)
        .get(`/books/${books[1]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
      });

      it('should return 404 if book not found', (done) => {
        var hexId = new ObjectID().toHexString();
        request(app)
        .get(`/books/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
      });

      it('should return 404 for non-obj ID', (done) => {
        request(app)
        .get(`/books/123`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
      });
    });

    describe('UPDATE /books/:id', () => {
        it('should update the book', (done) => {
          var hexId = books[0]._id.toHexString();
          var title = 'This should be the new text';
          request(app)
          .patch(`/books/${hexId}`)
          .set('x-auth', users[0].tokens[0].token)
          .send({
            title
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.book.title).toBe(title);
          })
          .end(done)
        });
    });
});


describe('****USER****', () => {
  describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
      request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
    });

    it('should return 401 if not authenticated', (done) => {
      request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
    });
  });

  describe('POST /users/', () => {
    it('should create a user', (done) => {
      var email = 'expm@test.com';
      var password = '123abc!';

      request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email).toBe(email);
      }).end((err) => {
        if(err) {
          return done(err);
        }
        User.find({email}).then((user) => {
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(password);
          done();
        }).catch((e) => done(e));
      });
    });

    it('should return validation err if request invalid', (done) => {
      var email = 'etetyewyew';
      var password = '123';

      request(app)
      .post('/users')
      .send({email, password})
      .expect(400).end(done);
    });

    it('should not create user if email in use', (done) => {
      var email = users[0].email;
      var password = '123abc!';

      request(app)
      .post('/users')
      .send({email, password})
      .expect(400).end(done);
    });
  });

  describe('POST /users/login', () => {
    it('sholud login user and return auth token', (done) => {
      request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.findById(users[1]._id).then((user) => {
          expect(user.toObject().tokens[1]).toMatchObject({
            access: 'auth',
            token: res.headers['x-auth']
          });
          done();
        }).catch((e) => done(e));
      })
    });

    it('sholud reject invalid login', (done) => {
      var invalidPswd = 'asgsagg';

      request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: invalidPswd
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeFalsy();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).toBe(1);
          done();
        }).catch((e) => done(e));
      })
    });
  });

  describe('POST /users/me/token', () => {
    it('should delete auth token on logout', (done) => {
      request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      });
    });
  });
});

describe('****AUTHORS****', () => {
  describe('POST /author', () => {
    it('should create a new author', (done) => {
    const author = {
      firstNames: 'Test book title',
      names: 'Orginal title',
      _creator: users[0]._id
    };
    request(app)
    .post('/author')
    .set('x-auth', users[0].tokens[0].token)
    .send(author)
    .expect(200)
    .end((err, res) => {
    if(err) {
          return done();
        }
        Author.find(author).then((authors) => {
          expect(authors.length).toBe(1);
          expect(authors[0].firstNames).toBe(author.firstNames);
          expect(authors[0].names).toBe(author.names);
          expect(authors[0]._creator).toEqual(author._creator);
          done();
        }).catch((e) => done());
      });
    });

    it('should not create author with invalid data', (done) => {
      request(app)
      .post('/author')
      .set('x-auth', users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if(err) {
          return done();
        }
        Author.find().then((authors) => {
          expect(authors.length).toBe(2);
          done();
        }).catch((e) => done());
      });
    });
  });

  describe('GET /author', () => {
    it('should get all authors', (done) => {
      request(app)
      .get('/author')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.authors.length).toBe(1);
      })
      .end(done)
    });
  });

  describe('GET /author/:id', () => {
    it('should return author by id', (done) => {
      request(app)
      .get(`/author/${authors[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.author.firstNames).toBe(authors[0].firstNames);
      })
      .end(done);
    });

      it('should not return author from other user', (done) => {
        request(app)
        .get(`/author/${authors[1]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
      });

      it('should return 404 if author not found', (done) => {
        var hexId = new ObjectID().toHexString();
        request(app)
        .get(`/author/${hexId}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
      });

      it('should return 404 for non-obj ID', (done) => {
        request(app)
        .get(`/author/123`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(404)
        .end(done);
      });
    });

    describe('UPDATE /author/:id', () => {
        it('should update the author', (done) => {
          var hexId = authors[0]._id.toHexString();
          var firstNames = 'This should be the new text';
          request(app)
          .patch(`/author/${hexId}`)
          .set('x-auth', users[0].tokens[0].token)
          .send({
            firstNames
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.author.firstNames).toBe(firstNames);
          })
          .end(done)
        });
    });
});
