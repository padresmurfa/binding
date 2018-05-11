import _ from 'lodash';

const propertyNamesRegistry = new WeakMap();

function isConstructor(funcName)
{
    return funcName === "constructor";
}

function isPrivate(funcName)
{
    // python-style private properties
    return funcName.startsWith("__");
}

function findOrCreatePropertyNames(targetClass)
{
    let propertyNames = propertyNamesRegistry.get(targetClass);

    if (propertyNames !== undefined)
    {
        return propertyNames;
    } 

    propertyNames = Object.getOwnPropertyNames(targetClass.prototype);
    
    propertyNames = _.filter(propertyNames,(propertyName)=>
    {
        const propertyValue = targetClass.prototype[propertyName];

        if (!_.isFunction(propertyValue))
        {
            return false;
        }

        if (isPrivate(propertyName))
        {
            return false;
        }

        if (isConstructor(propertyName))
        {
            return false;
        }

        return true;
    });

    propertyNamesRegistry.set(targetClass, propertyNames);

    return propertyNames;
}

function prebind(targetClass, ...args)
{
    const target = new targetClass(...args);        

    const propertyNames = findOrCreatePropertyNames(targetClass);

    _.forEach(propertyNames,(propertyName)=>
    {        
        const method = target[propertyName];

        const boundMethod = method.bind(target);

        target[propertyName] = boundMethod;
    });

    return target;
};

function jitbind(targetClass, ...args)
{
    const target = new targetClass(...args);

    const propertyNames = findOrCreatePropertyNames(targetClass);

    const jitClass = function (target)
    {
        // TODO: do this with proxies under ES6
        // TODO: consider caching based on weakref of this

        // create an object, props, consisting of a getter for each
        // property name that jit-creates a bound method
        const props = {};
        
        _.reduce(propertyNames,
            (_ignore, propertyName)=>{
                props[propertyName] = {
                    get: ()=>{ return target[propertyName].bind(target); }
                };
            }
        );

        Object.defineProperties(this, props);        
    };

    jitClass.name = "$jit-" + targetClass.name;

    return new jitClass(target);
}

class Factory
{
    prebind(targetClass, ...args)
    {
        return prebind(targetClass, ...args);
    }

    JIT(targetClass, ...args)
    {
        return prebind(targetClass, ...args);
    }
}

const factory = new Factory();

export default factory;
