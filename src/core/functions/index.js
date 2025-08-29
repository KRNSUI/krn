// FlexNetJSX Core Functions
// Functional programming utilities for Karen on SUI application

// ===== FUNCTION COMPOSITION =====

// Function composition (right to left)
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

// Function composition (left to right)
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);

// ===== CURRYING =====

// Currying utility
const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    return (...moreArgs) => curried.apply(this, args.concat(moreArgs));
  };
};

// ===== BASIC FUNCTIONS =====

// Identity function
const identity = (x) => x;

// Constant function
const constant = (x) => () => x;

// Tap function for side effects
const tap = (f) => (x) => {
  f(x);
  return x;
};

// ===== ARRAY UTILITIES =====

// Array utilities with currying
const map = curry((f, xs) => xs.map(f));
const filter = curry((f, xs) => xs.filter(f));
const reduce = curry((f, init, xs) => xs.reduce(f, init));
const find = curry((f, xs) => xs.find(f));
const head = (xs) => xs[0];
const tail = (xs) => xs.slice(1);
const length = (xs) => xs.length;
const isEmpty = (xs) => xs.length === 0;

// ===== STRING UTILITIES =====

// String utilities with currying
const trim = (str) => str.trim();
const toLowerCase = (str) => str.toLowerCase();
const toUpperCase = (str) => str.toUpperCase();
const split = curry((delimiter, str) => str.split(delimiter));
const join = curry((delimiter, xs) => xs.join(delimiter));

// ===== OBJECT UTILITIES =====

// Object utilities with currying
const prop = curry((key, obj) => obj[key]);
const assoc = curry((key, value, obj) => ({ ...obj, [key]: value }));
const dissoc = curry((key, obj) => {
  const { [key]: _, ...rest } = obj;
  return rest;
});
const keys = (obj) => Object.keys(obj);
const values = (obj) => Object.values(obj);
const entries = (obj) => Object.entries(obj);

// ===== PREDICATE FUNCTIONS =====

// Type checking
const isString = (x) => typeof x === 'string';
const isNumber = (x) => typeof x === 'number';
const isBoolean = (x) => typeof x === 'boolean';
const isFunction = (x) => typeof x === 'function';
const isObject = (x) => typeof x === 'object' && x !== null;
const isArray = (x) => Array.isArray(x);

// Comparison
const equals = curry((a, b) => a === b);
const not = (x) => !x;
const gt = curry((a, b) => a > b);
const gte = curry((a, b) => a >= b);
const lt = curry((a, b) => a < b);
const lte = curry((a, b) => a <= b);

// ===== LOGICAL FUNCTIONS =====

// Logical operations
const and = curry((a, b) => a && b);
const or = curry((a, b) => a || b);
const all = (predicate, xs) => xs.every(predicate);
const any = (predicate, xs) => xs.some(predicate);

// ===== EXPORTS =====

export {
  // Composition
  compose,
  pipe,
  
  // Currying
  curry,
  
  // Basic functions
  identity,
  constant,
  tap,
  
  // Array utilities
  map,
  filter,
  reduce,
  find,
  head,
  tail,
  length,
  isEmpty,
  
  // String utilities
  trim,
  toLowerCase,
  toUpperCase,
  split,
  join,
  
  // Object utilities
  prop,
  assoc,
  dissoc,
  keys,
  values,
  entries,
  
  // Predicates
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isObject,
  isArray,
  equals,
  not,
  gt,
  gte,
  lt,
  lte,
  
  // Logical
  and,
  or,
  all,
  any
};
