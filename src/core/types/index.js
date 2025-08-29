// FlexNetJSX Type System
// Functional programming types for Karen on SUI application

// ===== MAYBE TYPE =====

const Maybe = {
  Just: (value) => ({
    type: 'Just',
    value,
    map: (f) => Maybe.Just(f(value)),
    flatMap: (f) => f(value),
    fold: (onNothing, onJust) => onJust(value),
    isJust: () => true,
    isNothing: () => false
  }),
  
  Nothing: () => ({
    type: 'Nothing',
    map: () => Maybe.Nothing(),
    flatMap: () => Maybe.Nothing(),
    fold: (onNothing) => onNothing(),
    isJust: () => false,
    isNothing: () => true
  }),
  
  fromNullable: (value) => value == null ? Maybe.Nothing() : Maybe.Just(value),
  fromPredicate: (predicate, value) => predicate(value) ? Maybe.Just(value) : Maybe.Nothing()
};

// ===== EITHER TYPE =====

const Either = {
  Left: (error) => ({
    type: 'Left',
    error,
    map: () => Either.Left(error),
    flatMap: () => Either.Left(error),
    fold: (onLeft) => onLeft(error),
    isLeft: () => true,
    isRight: () => false
  }),
  
  Right: (value) => ({
    type: 'Right',
    value,
    map: (f) => Either.Right(f(value)),
    flatMap: (f) => f(value),
    fold: (onLeft, onRight) => onRight(value),
    isLeft: () => false,
    isRight: () => true
  }),
  
  fromNullable: (error, value) => value == null ? Either.Left(error) : Either.Right(value),
  fromPredicate: (predicate, error, value) => predicate(value) ? Either.Right(value) : Either.Left(error)
};

// ===== RESULT TYPE =====

const Result = {
  Success: (value) => ({
    type: 'Success',
    value,
    map: (f) => Result.Success(f(value)),
    flatMap: (f) => f(value),
    fold: (onError, onSuccess) => onSuccess(value),
    isSuccess: () => true,
    isFailure: () => false
  }),
  
  Failure: (error) => ({
    type: 'Failure',
    error,
    map: () => Result.Failure(error),
    flatMap: () => Result.Failure(error),
    fold: (onError) => onError(error),
    isSuccess: () => false,
    isFailure: () => true
  }),
  
  fromPromise: async (promise) => {
    try {
      const value = await promise;
      return Result.Success(value);
    } catch (error) {
      return Result.Failure(error);
    }
  }
};

// ===== EFFECT TYPE =====

const Effect = {
  of: (fn) => ({
    type: 'Effect',
    run: fn,
    map: (f) => Effect.of((...args) => f(fn(...args))),
    flatMap: (f) => Effect.of((...args) => f(fn(...args)).run(...args)),
    tap: (f) => Effect.of((...args) => {
      const result = fn(...args);
      f(result);
      return result;
    })
  }),
  
  fromPromise: (promise) => Effect.of(() => promise),
  fromSync: (fn) => Effect.of(fn)
};

// ===== EXPORTS =====

export {
  Maybe,
  Either,
  Result,
  Effect
};
