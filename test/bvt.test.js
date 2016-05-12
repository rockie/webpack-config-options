'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var should = require('should');
var webpack = require('webpack');
var path = require('path');
var koa = require('koa');
var fs = require('fs');
var koaStatic = require('koa-static');
var webpackConfig = require('..');

var childProcess = require('child_process')
var phantomjs = require('phantomjs-prebuilt')
var binPath = phantomjs.path

describe('bvt test', function () {
    it('development mode', function (done) {
        this.timeout(10000);

        try {
            fs.unlinkSync(path.join(__dirname, './build/scripts/index.bundle.js'));
            fs.unlinkSync(path.join(__dirname, './build/scripts/index.bundle.js.map'));
            fs.unlinkSync(path.join(__dirname, './build/styles/index.style.css'));
            fs.unlinkSync(path.join(__dirname, './build/styles/index.style.css.map'));
        } catch(e) {}

        var config = webpackConfig({ index: './test/project1/app/index.jsx' }, './test/build', 'http://localhost:3000', { postcss: true });

        var compiler = webpack(config);
        compiler.run(function(err, stats) {
            if (err) {
                done(err);
            } else {
                var jsonStats = stats.toJson();
                if (jsonStats.errors.length > 0) {
                    done(jsonStats.errors);
                    return;
                }

                should.ok(fs.existsSync(path.join(__dirname, './build/scripts/index.bundle.js')));
                should.ok(fs.existsSync(path.join(__dirname, './build/scripts/index.bundle.js.map')));
                should.ok(fs.existsSync(path.join(__dirname, './build/styles/index.style.css')));
                should.ok(fs.existsSync(path.join(__dirname, './build/styles/index.style.css.map')));

                var app = koa();

                app.use(koaStatic('./test/build'));

                request(app.listen())
                    .get('/')
                    .expect('content-type', 'text/html; charset=utf-8')
                    .expect(/<title>project1<\/title>/)
                    .expect(200)
                    .end(function(err){
                        if (err) return done(err);

                        var childArgs = [
                            path.join(__dirname, 'phantomjs-script.js'),
                            this.url
                        ];

                        childProcess.execFile(binPath, childArgs, function(err2, stdout, stderr) {
                            // handle results
                            if (err2) {
                                console.log(stderr);
                                return done(err2);
                            }

                            should.exist(stdout.trim() === 'Hello Babel!');
                            done();
                        });
                    });
            }
        });
    });
    it('production mode', function (done) {
        this.timeout(10000);

        try {
            fs.unlinkSync(path.join(__dirname, './build/scripts/index.bundle.js'));
            fs.unlinkSync(path.join(__dirname, './build/styles/index.style.css'));
        } catch(e) {}

        var config = webpackConfig(
            { index: './test/project1/app/index.jsx' },
            './test/build',
            'http://localhost:3000',
            { production: true });

        var compiler = webpack(config);
        compiler.run(function(err, stats) {
            if (err) {
                done(err);
            } else {
                var jsonStats = stats.toJson();
                if (jsonStats.errors.length > 0) {
                    done(jsonStats.errors);
                    return;
                }

                should.ok(fs.existsSync(path.join(__dirname, './build/scripts/index.bundle.js')));
                should.ok(fs.existsSync(path.join(__dirname, './build/styles/index.style.css')));

                var app = koa();

                app.use(koaStatic('./test/build'));

                request(app.listen())
                    .get('/')
                    .expect('content-type', 'text/html; charset=utf-8')
                    .expect(/<title>project1<\/title>/)
                    .expect(200)
                    .end(function(err){
                        if (err) return done(err);

                        var childArgs = [
                            path.join(__dirname, 'phantomjs-script.js'),
                            this.url
                        ];

                        childProcess.execFile(binPath, childArgs, function(err2, stdout, stderr) {
                            // handle results
                            if (err2) {
                                console.log(stderr);
                                return done(err2);
                            }

                            should.exist(stdout.trim() === 'Hello Babel!');
                            done();
                        });
                    });
            }
        });
    });
});