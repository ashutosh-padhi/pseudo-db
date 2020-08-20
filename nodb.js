const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid').v4;
const packageJson = require('./package.json');
const { synchronize, extend, pass } = require('./utils');

var nodbTemplate = {
    version: packageJson.version,
    collections: {},
};
var collectionTemplate = `{
    "version":"${packageJson.version}",
    "data":[]
}`;

/**
 * Initiate a db instance. It is sync method.
 * @param {path to db folder} dbpath
 * @param {name of the db} dbname
 */
var initiateDB = function (dbpath, dbname) {
    if (!fs.existsSync(dbpath)) throw new Error("path doesn't exists");
    else if (!fs.existsSync(path.join(dbpath, dbname)))
        fs.mkdirSync(path.join(dbpath, dbname), 0744);
    let nodbroot = path.join(dbpath, dbname, 'nodb.json');
    let nodb = nodbTemplate;
    if (!fs.existsSync(nodbroot)) {
        fs.writeFileSync(nodbroot, JSON.stringify(nodbTemplate));
    } else {
        nodb = JSON.parse(fs.readFileSync(nodbroot, 'utf-8'));
    }

    var db = {
        /**
         * Get a instance of collection or create a connection with the config.
         * If collection exists the config option will be ignored
         *
         * @param {collection name} cName
         * @param {configuration} config
         */
        collection: function (cName, config) {
            let collection;
            if (!nodb.collections[cName]) {
                nodb.collections[cName] = extend({ name: cName }, config);
                fs.writeFileSync(nodbroot, JSON.stringify(nodb));
            }
            collection = nodb.collections[cName];
            return Collection(collection, path.join(dbpath, dbname));
        },
    };
    return db;
};

function Collection(collectionConfig, root) {
    let collectionName = collectionConfig.name;
    let collectionPath = path.join(root, `${collectionName}.json`);
    if (!fs.existsSync(collectionPath)) {
        let c = JSON.parse(collectionTemplate);
        c = extend(c, collectionConfig);
        fs.writeFileSync(collectionPath, JSON.stringify(c));
    }
    let open = (next) => {
        fs.readFile(collectionPath, 'utf-8', (e, d) => {
            next(JSON.parse(d));
        });
    };
    let insert = (next, record, collection) => {
        let today = new Date().toISOString();
        if (collection.dateAudit) {
            record.created_date = today;
            record.modified_date = today;
        }
        record._id = uuidv4();
        collection.data.push(record);
        fs.writeFile(collectionPath, JSON.stringify(collection), function () {
            next(record);
        });
    };
    let finder = (inv) => (next, filter, collection) => {
        let data = collection.data;
        let filterArray = [];
        for (let prop in filter) {
            if (inv) filterArray.push((e) => e[prop] !== filter[prop]);
            else filterArray.push((e) => e[prop] === filter[prop]);
        }
        let filterFn = (r) => filterArray.reduce((a, f) => a && f(r), true);
        next(data.filter(filterFn), collection);
    };
    let find = finder();
    let inverseFind = finder(true);
    let update = (next, setlist, records, collection) => {
        records.forEach((r) => extend(r, setlist));
        fs.writeFile(collectionPath, JSON.stringify(collection), function () {
            next({ count: records.length });
        });
    };
    let saveAfterHardDelete = (next, records, collection) => {
        let deletedCount = collection.data.length - records.length;
        collection.data = records;
        fs.writeFile(collectionPath, JSON.stringify(collection), function () {
            next({ count: deletedCount });
        });
    };

    return {
        insert: function (record, cb) {
            synchronize(open, pass(insert, record), (next, record) => {
                cb(record);
            });
        },
        update: function (filter, setlist, cb) {
            synchronize(
                open,
                pass(find, extend(filter, { __deleted: undefined })),
                pass(update, setlist),
                (next, result) => {
                    cb(result);
                }
            );
        },
        find: function (filter, cb) {
            synchronize(
                open,
                pass(find, extend(filter, { __deleted: undefined })),
                (next, records) => {
                    cb(records);
                }
            );
        },
        delete: function (filter, cb) {
            synchronize(
                open,
                pass(find, extend(filter, { __deleted: undefined })),
                pass(update, { __deleted: true }),
                (next, result) => {
                    cb(result);
                }
            );
        },
        hardDelete: function (filter, cb) {
            synchronize(
                open,
                pass(inverseFind, extend(filter, { __deleted: undefined })),
                saveAfterHardDelete,
                (next, result) => {
                    cb(result);
                }
            );
        },
    };
}
module.exports = { initiateDB };
