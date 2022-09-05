declare type TypedArray = Int8Array |
    Int16Array  |
    Int32Array  |
    Uint8Array  |
    Uint16Array |
    Uint32Array |
    Float32Array |
    Uint8ClampedArray;

declare type TypedArrayConstructor = Int8ArrayConstructor |
    Int16ArrayConstructor  |
    Int32ArrayConstructor  |
    Uint8ArrayConstructor  |
    Uint16ArrayConstructor |
    Uint32ArrayConstructor |
    Float32ArrayConstructor |
    Uint8ClampedArrayConstructor;

declare type NoReadonly<T> = { -readonly [P in keyof T]: T[P] };
