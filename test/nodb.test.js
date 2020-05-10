var {expect, should} = require('chai');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var { synchronize } = require('../utils');

var { initiateDB } = require('../nodb');
const dbpath = path.join(__dirname,'../db');
const dbname = 'test';

describe("nodb", function(){
    before(function(done){
        rimraf(path.join(dbpath,dbname), done);
    })
    describe("db", function(){
        it("it should throw error if folder doesn\'t exists", function(){
            should().throw(()=>initiateDB('../asd',dbname), Error);
        })

        it("it should create a db instance", function(done){
            initiateDB(dbpath,dbname);
            expect(fs.existsSync(dbpath,dbname)).to.be.true;
            synchronize(
                next=>{
                    fs.readFile(path.join(dbpath,dbname,'nodb.json'),'utf-8',(e,d)=>{
                        next(JSON.parse(d));
                    })
                },
                (next,d)=>{
                    should().exist(d.collections);
                    done();
                }
            )
        })

        it('it should not throw error if db already exists', function(){
            should().not.throw(()=>initiateDB(dbpath,dbname));
        })

        it('it should add collection', function(done){
            let db = initiateDB(dbpath,dbname);
            db.collection('testcol');
            expect(fs.existsSync(path.join(dbpath, dbname, 'testcol.json'))).to.be.true;
            synchronize(
                next=>{
                    fs.readFile(path.join(dbpath,dbname,'testcol.json'),'utf-8',(e,d)=>{
                        next(JSON.parse(d));
                    })
                },
                (next,d)=>{
                    should().exist(d.name);
                    expect(d.name).to.equal('testcol');
                    done();
                }
            )
        })

        it('it should not throw error if collection already exists', function(){
            let db = initiateDB(dbpath,dbname);
            should().not.throw(()=>db.collection('testcol'));
        })

        it('it should insert records into collection', function(done){
            let db = initiateDB(dbpath, dbname);
            db.collection('testcol').insert({name:'ashutosh'},(record)=>{
                should().exist(record.name);
                should().exist(record._id);
                expect(record.name).to.equal('ashutosh');
                done();
            })

        })

        it('it should create collection with config', function(done){
            let db = initiateDB(dbpath, dbname);
            db.collection('testcol_config',{dateAudit:true});
            synchronize(
                next=>{
                    fs.readFile(path.join(dbpath,dbname,'testcol_config.json'),'utf-8',(e,d)=>{
                        next(JSON.parse(d));
                    })
                },
                (next,d)=>{
                    should().exist(d.dateAudit);
                    expect(d.dateAudit).to.be.true;
                    next();
                },
                next=>{
                    fs.readFile(path.join(dbpath,dbname,'nodb.json'),'utf-8',(e,d)=>{
                        next(JSON.parse(d));
                    })
                },
                (next,d)=>{
                    should().exist(d.collections.testcol_config);
                    expect(d.collections.testcol_config.dateAudit).to.be.true;
                    done();
                }
            )
        })

        it('it should add date audit fields with insert', function(done){
            let db = initiateDB(dbpath, dbname);
            db.collection('testcol_config').insert({name:'ashutosh'},record=>{
                should().exist(record.created_date);
                should().exist(record.modified_date);
                done();
            });
        })

        it('it should able to find inserted records', function(done){
            let db = initiateDB(dbpath,dbname);
            synchronize(
                next=> db.collection('name_test').insert({name:'ashutosh'},r=>next()),
                next=> db.collection('name_test').insert({name:'chinmoya'},r=>next()),
                next=>{
                    db.collection('name_test').find({},r=>{
                        expect(r.length).to.equal(2);
                        next();
                    })
                },
                next=>{
                    db.collection('name_test').find({name:'ashutosh'},r=>{
                        expect(r.length).to.equal(1);
                        done();
                    })
                }
            )
        })

        it('it should update filtered record', function(done){
            let db = initiateDB(dbpath,dbname);
            synchronize(
                next=>{
                    db.collection('name_test').update({name:'ashutosh'},{name:'new ashutosh'},r=>{
                        expect(r.count).to.equal(1);
                        next();
                    })
                },
                next=>{
                    db.collection('name_test').find({name:'ashutosh'},r=>{
                        expect(r.length).to.equal(0);
                        next();
                    })
                },
                next=>{
                    db.collection('name_test').find({name:'new ashutosh'},r=>{
                        expect(r.length).to.equal(1);
                        done();
                    })
                }
            )
        })

        it('it should delete filtered records', function(done){
            let db = initiateDB(dbpath,dbname);
            synchronize(
                next=> db.collection('name_test2').insert({name:'ashutosh'},r=>next()),
                next=> db.collection('name_test2').insert({name:'chinmoya'},r=>next()),
                next=>{
                    db.collection('name_test2').delete({name:'ashutosh'},r=>{
                        expect(r.count).to.equal(1);
                        next();
                    })
                },
                next=>{
                    db.collection('name_test2').find({name:'ashutosh'},r=>{
                        expect(r.length).to.equal(0);
                        done();
                    })
                }
            )
        })

        it('it should hard delete filtered records', function(done){
            let db = initiateDB(dbpath,dbname);
            synchronize(
                next=>{
                    db.collection('name_test2').hardDelete({name:'chinmoya'},r=>{
                        expect(r.count).to.equal(1);
                        next();
                    })
                },
                next=>{
                    db.collection('name_test2').find({name:'chinmoya'},r=>{
                        expect(r.length).to.equal(0);
                        done();
                    })
                }
            )
        })
    })
})