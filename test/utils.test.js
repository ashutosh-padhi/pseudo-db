var {expect, should} = require('chai');
var util = require('../utils');

describe('Util', function() {
    describe('#synchronize()', function() {

        it('it should call the callback', function() {
            let x = 0;
            var cb = (n)=>{
                x++;
            };
            util.synchronize(cb);
            expect(x).to.equal(1);
        });

        it('it should not call the proceding callbacks without next()', function() {
            let x = 0;
            var cb = (n)=>{
                x++;
            };
            util.synchronize(cb,cb);
            expect(x).to.equal(1);
        });

        it('it should call all the callbacks', function() {
            let x = 0;
            var cb = (n)=>{
                x++;
                n();
            };
            util.synchronize(cb,cb);
            expect(x).to.equal(2);
        });

        it('2nd callback should get passed arguments', function() {
            var cb = (n)=>{
                n(1);
            };
            var cb1 = (n,d)=>{
                expect(d).to.equal(1);
                n(1,2);
            };
            var cb2 = (n,d,e)=>{
                expect(d).to.equal(1);
                expect(e).to.equal(2)
                n();
            };
            util.synchronize(cb,cb1,cb2);
        });

        it('it should throw error in case non function arguments', function() {
            var cb = {};
            should().Throw(()=>util.synchronize(cb),Error);
        });

        it('it should return data if the last callback returns data', function(){
            var cb1 = n=>n();
            var cb2 = n=>1;
            var r = util.synchronize(cb1,cb2);
            expect(r).is.equal(1);
        })

        it('it shouldn\'t return data if the last callback desn\'t returns data', function(){
            var cb1 = n=>n();
            var cb2 = n=>n();
            var r = util.synchronize(cb1,cb2);
            expect(r).is.equal(undefined);
        })

        it('it shouldn return the earliest return value', function(){
            var cb1 = n=>{n();return 1};
            var cb2 = n=>{n();return 2};
            var r = util.synchronize(cb1,cb2);
            expect(r).is.equal(1);
        })
    });

    describe('#extend()', function() {

        it('parent should have child property', function() {
            var original = {prop1:"prop1"};
            var child = {prop2:"prop2"};
            util.extend(original, child);
            should().exist(original.prop2);
        });

        it('parent\'s property should be replaced with child property', function() {
            var original = {prop1:"prop1"};
            var child = {prop1:"prop2"};
            util.extend(original, child);
            expect(original.prop1).to.equal("prop2");
        });

        it('should return parent with new properties', function() {
            var original = {prop1:"prop1"};
            var child = {prop2:"prop2"};
            var originalRef = util.extend(original, child);
            should().exist(originalRef.prop1);
            should().exist(originalRef.prop2);
        });

    });

    describe('#pass', function() {

        it('it should take bind data to new function', function(){
            var one =  function(d,e){
                expect(d).is.equal(1);
                expect(e).is.equal(2);
            };
            util.pass(one,1,2)
        })
    })
});