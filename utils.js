function synchronize(){
    var currentCallBackIndex = 0;
    var callbacks = arguments;
    function next(){
        var cb = callbacks[currentCallBackIndex++];
        if(typeof cb === 'function')
            return cb(next, ...arguments);
        else if(typeof cb === 'undefined') return;
        else throw new Error("expecting a function");
    }
    return next();
}

function pass(action, data){
    if(typeof action !== 'function') throw new Error('Expected a function');
    return function(){
        action(arguments[0], data, ...Array.prototype.slice.call(arguments,[1]));
    }
}

function extend(parent, child){
    for(let property in child){
        parent[property] = child[property];
    }
    return parent;
}

module.exports = {
    synchronize,
    extend,
    pass
}