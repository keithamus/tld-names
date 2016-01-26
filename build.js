const Transform = require('stream').Transform;
const inherits = require('util').inherits;

function NewLines() {
  Transform.call(this);
  this._transform = (chunk, encoding, done) => {
     var data = chunk.toString('utf8');
     if (this._lastLineData) {
       data = this._lastLineData + data
     }
     var lines = data.split('\n')
     this._lastLineData = lines.splice(lines.length - 1, 1)[0];
     lines.forEach(this.push.bind(this));
     done();
   };
   this._flush = (done) => {
     if (this._lastLineData) {
       this.push(this._lastLineData);
     }
     this._lastLineData = null;
     done();
   };
}
inherits(NewLines, Transform);

function DiscardComments() {
  Transform.call(this);
  this._transform = (chunk, encoding, done) => {
     var data = chunk.toString('utf8');
     if (data[0] !== '/' && data[1] !== '/') {
       this.push(data);
     }
     done();
   };
   this._flush  = (done) => done();
}
inherits(DiscardComments, Transform);

function DiscardBlankLines() {
  Transform.call(this);
  this._transform = (chunk, encoding, done) => {
     var data = chunk.toString('utf8');
     if (data[0] !== '') {
       this.push(String(data));
     }
     done();
   };
   this._flush  = (done) => done();
}
inherits(DiscardBlankLines, Transform);

const start = Date.now();
const res = require('https').request('https://publicsuffix.org/list/effective_tld_names.dat', (res) => {
  tlds = [];
  res.setEncoding('utf8')
    .pipe(new NewLines().setEncoding('utf8'))
    .pipe(new DiscardComments().setEncoding('utf8'))
    .pipe(new DiscardBlankLines().setEncoding('utf8'))
    .pipe(require('JSONStream').stringify())
    .pipe(require('fs').createWriteStream('./tld-names.json'))
    .on('finish', () => console.log('Wrote tld-names.json, %s ms', Date.now() - start))
});
res.end();
