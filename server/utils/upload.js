const express = require('express');
const fileUpload = require('express-fileupload');
const Dropbox = require('dropbox');
const fs = require('fs');

const ACCESS_TOKEN = '4xj3gS-k8TwAAAAAAAAm163_8dJmKzxncDT3IcDHng0Nux68gD3snLA-nz2ZCeZu'
const DBX = new Dropbox({ accessToken: ACCESS_TOKEN });

// let files = [];
// let FILE = {
//   file: fs.readFileSync('test.txt'),
//   name: 'test',
//   extension: 'txt'
// };
//
// files.push(FILE);
// FILE = {
//   file: fs.readFileSync('test2.txt'),
//   name: 'test2',
//   extension: 'txt'
// };
// files.push(FILE);
// FILE = {
//   //file: fs.readFileSync('test3.txt'),
//   name: 'test3',
//   extension: 'txt'
// };
// files.push(FILE);

// App key     oye3utrny6kmffz
// App secret  l32cnisplypalat
// 4xj3gS-k8TwAAAAAAAAm163_8dJmKzxncDT3IcDHng0Nux68gD3snLA-nz2ZCeZu

const sendToDbx = async (file, name, extension) => {
  if (!file && !name && !extension) {
    return {uploaded: false};
  }
  let dbx;
  try {
    dbx = await DBX
    .filesUpload({path: '/' + `${name}.${extension}`, contents: file});
    // console.log(dbx)
    return {uploaded: true};
  } catch (e) {
    // console.log(e)
  }
};


// let uploadedFiles = files.map((file) => sendToDbx(file.file, file.name, file.extension));

// console.log({uploadedFiles});


module.exports = {sendToDbx}
