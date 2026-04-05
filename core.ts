//// Copyright (C) 2026 The Calendrical System
//// SPDX-License-Identifier: 0BSD

import { dlopen, FFIType, type ConvertFns, type FFITypeToArgsType, suffix, read, type Pointer, toArrayBuffer, JSCallback, ptr, type FFITypeOrString, toBuffer } from "bun:ffi";
import { mkdir } from "node:fs/promises";
import path from "node:path";

// We found a bug of sometimes finding 9223372041243474000 like pointers for methods (safeSwiftUInt64ForKey)
// These pointers are >=53 bit so bun ffi cannot handle it

//// libc ffi

export const libcBindings = {
    malloc: {
        args: [FFIType.u64],
        returns: FFIType.u64,
    },
    free: {
        args: [FFIType.u64],
        returns: FFIType.void,
    },
} as const

export var libc: ConvertFns<typeof libcBindings> | null = null;

/// Framework paths

export const foundationFrameworkPath = "/System/Library/Frameworks/Foundation.framework/Foundation";
export const appKitFrameworkPath = "/System/Library/Frameworks/AppKit.framework/AppKit";
export const cocoaFrameworkPath = "/System/Library/Frameworks/Cocoa.framework/Cocoa";

//// objc runtime ffi

export enum ObjCFFIType {
    class = "u64",
    selector = "u64",
    id = "u64",
    method = "u64",
    protocol = "u64",
    ivar = "u64",
    property = "u64",
    imp = "u64",
    property_attribute = "buffer",
    method_description = "buffer",
}

export const objcRuntimeBindings = {
    class_getName: {
        args: [ObjCFFIType.class],
        returns: FFIType.cstring,
    },
    class_getSuperclass: {
        args: [ObjCFFIType.class],
        returns: ObjCFFIType.class,
    },
    class_isMetaClass: {
        args: [ObjCFFIType.class],
        returns: FFIType.bool,
    },
    class_getInstanceSize: {
        args: [ObjCFFIType.class],
        returns: FFIType.u32,
    },
    class_getInstanceVariable: {
        args: [ObjCFFIType.class, FFIType.cstring],
        returns: ObjCFFIType.ivar,
    },
    class_getClassVariable: {
        args: [ObjCFFIType.class, FFIType.cstring],
        returns: ObjCFFIType.ivar,
    },
    class_addIvar: {
        args: [FFIType.u64, FFIType.cstring, FFIType.u64, FFIType.u8, FFIType.cstring],
        returns: FFIType.bool,
    },
    class_copyIvarList: {
        args: [ObjCFFIType.class, FFIType.u64],
        returns: FFIType.u64,
    },
    class_getIvarLayout: {
        args: [ObjCFFIType.class],
        returns: FFIType.u64,
    },
    class_setIvarLayout: {
        args: [ObjCFFIType.class, FFIType.u64],
        returns: FFIType.void,
    },
    class_getWeakIvarLayout: {
        args: [ObjCFFIType.class],
        returns: FFIType.u64,
    },
    class_setWeakIvarLayout: {
        args: [ObjCFFIType.class, FFIType.u64],
        returns: FFIType.void,
    },
    class_getProperty: {
        args: [ObjCFFIType.class, FFIType.cstring],
        returns: ObjCFFIType.property,
    },
    class_copyPropertyList: {
        args: [ObjCFFIType.class, FFIType.u64],
        returns: FFIType.u64,
    },
    class_addMethod: {
        args: [ObjCFFIType.class, ObjCFFIType.selector, ObjCFFIType.imp, FFIType.cstring],
        returns: FFIType.bool,
    },
    class_getInstanceMethod: {
        args: [ObjCFFIType.class, ObjCFFIType.selector],
        returns: ObjCFFIType.method,
    },
    class_getClassMethod: {
        args: [ObjCFFIType.class, ObjCFFIType.selector],
        returns: ObjCFFIType.method,
    },
    class_copyMethodList: {
        args: [ObjCFFIType.class, FFIType.u64],
        returns: FFIType.u64,
    },
    class_replaceMethod: {
        args: [ObjCFFIType.class, ObjCFFIType.selector, ObjCFFIType.imp, FFIType.cstring],
        returns: ObjCFFIType.imp,
    },
    class_getMethodImplementation: {
        args: [ObjCFFIType.class, ObjCFFIType.selector],
        returns: ObjCFFIType.imp,
    },
    class_respondsToSelector: {
        args: [ObjCFFIType.class, ObjCFFIType.selector],
        returns: FFIType.bool,
    },
    class_addProperty: {
        args: [ObjCFFIType.class, FFIType.cstring, FFIType.u64, FFIType.u32],
        returns: FFIType.u64,
    },
    class_replaceProperty: {
        args: [ObjCFFIType.class, FFIType.cstring, FFIType.u64, FFIType.u32],
        returns: FFIType.void,
    },
    class_getVersion: {
        args: [ObjCFFIType.class],
        returns: FFIType.i32,
    },
    class_setVersion: {
        args: [ObjCFFIType.class, FFIType.i32],
        returns: FFIType.void,
    },
    class_createInstance: {
        args: [ObjCFFIType.class, FFIType.u32],
        returns: ObjCFFIType.id,
    },
    objc_allocateClassPair: {
        args: [ObjCFFIType.class, FFIType.cstring, FFIType.u32],
        returns: ObjCFFIType.class,
    },
    objc_disposeClassPair: {
        args: [ObjCFFIType.class],
        returns: FFIType.void,
    },
    objc_registerClassPair: {
        args: [ObjCFFIType.class],
        returns: FFIType.void,
    },
    objc_duplicateClass: {
        args: [ObjCFFIType.class, FFIType.cstring, FFIType.u32],
        returns: ObjCFFIType.class,
    },
    object_getIndexedIvars: {
        args: [ObjCFFIType.id],
        returns: FFIType.void,
    },
    object_getIvar: {
        args: [ObjCFFIType.id, ObjCFFIType.ivar],
        returns: ObjCFFIType.id,
    },
    object_setIvar: {
        args: [ObjCFFIType.id, ObjCFFIType.ivar, ObjCFFIType.id],
        returns: FFIType.void,
    },
    object_getClassName: {
        args: [ObjCFFIType.id],
        returns: FFIType.cstring,
    },
    object_getClass: {
        args: [ObjCFFIType.id],
        returns: ObjCFFIType.class,
    },
    object_setClass: {
        args: [ObjCFFIType.id, ObjCFFIType.class],
        returns: ObjCFFIType.class,
    },
    objc_copyClassList: {
        args: [FFIType.u64],
        returns: ObjCFFIType.class,
    },
    objc_lookUpClass: {
        args: [FFIType.cstring],
        returns: ObjCFFIType.class,
    },
    objc_getClass: {
        args: [FFIType.cstring],
        returns: ObjCFFIType.id,
    },
    objc_getRequiredClass: {
        args: [FFIType.cstring],
        returns: ObjCFFIType.class,
    },
    objc_getMetaClass: {
        args: [FFIType.cstring],
        returns: ObjCFFIType.class,
    },
    ivar_getName: {
        args: [ObjCFFIType.ivar],
        returns: FFIType.cstring,
    },
    ivar_getTypeEncoding: {
        args: [ObjCFFIType.ivar],
        returns: FFIType.cstring,
    },
    ivar_getOffset: {
        args: [ObjCFFIType.ivar],
        returns: FFIType.u64,
    },
    method_getName: {
        args: [ObjCFFIType.method],
        returns: ObjCFFIType.selector,
    },
    method_getImplementation: {
        args: [ObjCFFIType.method],
        returns: ObjCFFIType.imp,
    },
    method_getTypeEncoding: {
        args: [ObjCFFIType.method],
        returns: FFIType.cstring,
    },
    method_copyReturnType: {
        args: [ObjCFFIType.method],
        returns: FFIType.cstring,
    },
    method_copyArgumentType: {
        args: [ObjCFFIType.method, FFIType.u32],
        returns: FFIType.cstring,
    },
    method_getNumberOfArguments: {
        args: [ObjCFFIType.method],
        returns: FFIType.u32,
    },
    method_setImplementation: {
        args: [ObjCFFIType.method, ObjCFFIType.imp],
        returns: ObjCFFIType.imp,
    },
    method_exchangeImplementations: {
        args: [ObjCFFIType.method, ObjCFFIType.method],
        returns: FFIType.void,
    },
    sel_getName: {
        args: [ObjCFFIType.selector],
        returns: FFIType.cstring,
    },
    sel_registerName: {
        args: [FFIType.cstring],
        returns: ObjCFFIType.selector,
    },
    sel_getUid: {
        args: [FFIType.cstring],
        returns: ObjCFFIType.selector,
    },
    property_getName: {
        args: [ObjCFFIType.property],
        returns: FFIType.cstring,
    },
    property_copyAttributeValue: {
        args: [ObjCFFIType.property, FFIType.cstring],
        returns: FFIType.cstring,
    },
    property_getAttributes: {
        args: [ObjCFFIType.property],
        returns: FFIType.cstring,
    },
    property_copyAttributeList: {
        args: [ObjCFFIType.property, FFIType.u64],
        returns: FFIType.u64,
    },
    class_addProtocol: {
        args: [ObjCFFIType.class, ObjCFFIType.protocol],
        returns: FFIType.bool,
    },
    class_conformsToProtocol: {
        args: [ObjCFFIType.class, ObjCFFIType.protocol],
        returns: FFIType.bool,
    },
    objc_getProtocol: {
        args: [FFIType.cstring],
        returns: ObjCFFIType.protocol,
    },
    objc_copyProtocolList: {
        args: [FFIType.u64],
        returns: ObjCFFIType.protocol,
    },
    objc_allocateProtocol: {
        args: [FFIType.cstring],
        returns: ObjCFFIType.protocol,
    },
    objc_registerProtocol: {
        args: [ObjCFFIType.protocol],
        returns: FFIType.void,
    },
    protocol_addMethodDescription: {
        args: [ObjCFFIType.protocol, ObjCFFIType.selector, FFIType.cstring, FFIType.bool, FFIType.bool],
        returns: FFIType.void,
    },
    protocol_addProtocol: {
        args: [ObjCFFIType.protocol, ObjCFFIType.protocol],
        returns: FFIType.void,
    },
    protocol_getName: {
        args: [ObjCFFIType.protocol],
        returns: FFIType.cstring,
    },
    protocol_isEqual: {
        args: [ObjCFFIType.protocol, ObjCFFIType.protocol],
        returns: FFIType.bool,
    },
    protocol_copyMethodDescriptionList: {
        args: [ObjCFFIType.protocol, FFIType.bool, FFIType.bool, FFIType.u64],
        returns: FFIType.u64,
    },
    // by-value struct return has issue in bun-ffi
    // protocol_getMethodDescription: {
    //     args: [ObjCFFIType.protocol, ObjCFFIType.selector, FFIType.bool, FFIType.bool],
    //     returns: ObjCFFIType.method_description,
    // },
    protocol_copyPropertyList: {
        args: [ObjCFFIType.protocol, FFIType.u64],
        returns: FFIType.u64,
    },
    protocol_getProperty: {
        args: [ObjCFFIType.protocol, FFIType.cstring, FFIType.bool, FFIType.bool],
        returns: ObjCFFIType.property,
    },
    protocol_copyProtocolList: {
        args: [ObjCFFIType.protocol, FFIType.u64],
        returns: FFIType.u64,
    },
    protocol_conformsToProtocol: {
        args: [ObjCFFIType.protocol, ObjCFFIType.protocol],
        returns: FFIType.bool,
    },
} as const;

const appKitBindings = {
    NSApplicationMain: {
        args: [FFIType.i32, FFIType.u64],
        returns: FFIType.i32,
    }
} as const;

//// Load and Unload

class FrameworkNotLoadedError extends Error {
    constructor(message: string, public field: string) {
        super(message);
        this.name = 'FrameworkNotLoadedError';
    }
}

/**
 * The Foundation framework. Contains bare Obj-C Runtime functions and provide access to basic Obj-C environment.
 */
export var foundation: ConvertFns<typeof objcRuntimeBindings> | null = null;
/**
 * The AppKit framework.
 */
export var appKit: ConvertFns<typeof appKitBindings> | null = null;
/**
 * The Cocoa framework.
 */
export var cocoa: ConvertFns<typeof objcRuntimeBindings> | null = null;

/**
 * Load Obj-C frameworks.
 * 
 * This includes Foundation, AppKit and Cocoa
 */
export function load() {
    libc = dlopen(`libc.${suffix}`, libcBindings).symbols;
    foundation = dlopen(foundationFrameworkPath, objcRuntimeBindings).symbols;
    appKit = dlopen(appKitFrameworkPath, appKitBindings).symbols;
    cocoa = dlopen(cocoaFrameworkPath, objcRuntimeBindings).symbols;
}

/**
 * Unload Obj-C frameworks.
 */
export function unload() {
    // Nobody dlclose ;p
    libc = null;
    foundation = null;
    appKit = null;
    cocoa = null;
}

export function assertFoundation(lib: any): asserts lib is ConvertFns<typeof objcRuntimeBindings> {
    if (!lib || typeof lib.class_getName !== "function" || typeof lib.sel_registerName !== "function") {
        throw new FrameworkNotLoadedError("Foundation framework is not loaded. Please call load() before accessing any classes.", "foundation");
    }
}

//// Invocation

export type VariadicInvocationArg = {
    type: ObjCType | FFITypeOrString;
    value: any;
}

export function selPtr(selector: string | ObjCSelector | FFITypeToArgsType[FFIType.u64]): FFITypeToArgsType[FFIType.u64] {
    return selector instanceof ObjCSelector
        ? selector.__ts_objc_ptr
        : typeof selector === "string"
            ? foundation?.sel_registerName(Buffer.from(selector + "\0")) ?? 0
            : selector;
}

function msgReceiverPtr(receiver: ObjCObject | typeof ObjCClass | FFITypeToArgsType[FFIType.u64]): FFITypeToArgsType[FFIType.u64] {
    return receiver instanceof ObjCObject || isObjCClass(receiver)
        ? receiver.__ts_objc_ptr
        : receiver;
}

function dispatchVariadicInvocationArgs(args: VariadicInvocationArg[]): { defArgs: (ObjCFFIType | FFITypeOrString)[]; callArgs: any[] } {
    let defArgs: (ObjCFFIType | FFITypeOrString)[] = [];
    let callArgs: any[] = [];
    for (const { type, value } of args) {
        defArgs.push(isObjCType(type) ? objcTypeToFFIType(type) : type);
        callArgs.push(value instanceof ObjCObject || isObjCClass(value)
            ? value.__ts_objc_ptr
            : type === ObjCType.selector && typeof value === "string"
                ? selPtr(value)
                : Object.values(FFIType).includes(type as FFIType)
                    ? value
                    : translateToForeign(value, type));
    }
    return { defArgs, callArgs };
}

function raw_msgSend(returnType: FFIType, receiver: FFITypeToArgsType[FFIType.u64], selector: FFITypeToArgsType[FFIType.u64], ...args: { type: FFIType, value: unknown }[]): unknown {
    assertFoundation(foundation);
    let defArgs: FFIType[] = [FFIType.u64, FFIType.u64];
    let callArgs: any[] = [receiver, selector];
    for (const { type, value } of args) {
        defArgs.push(type);
        callArgs.push(value);
    }
    return dlopen(foundationFrameworkPath, {
        objc_msgSend: {
            args: defArgs,
            returns: returnType,
        },
    }).symbols.objc_msgSend(...callArgs);
}

// [TODO]
function raw_msgSendSuper(returnType: FFIType, receiver: FFITypeToArgsType[FFIType.u64], selector: FFITypeToArgsType[FFIType.u64], ...args: { type: FFIType, value: unknown }[]): unknown {
    assertFoundation(foundation);
    const superCls = foundation.object_getClass(receiver);
    if (!superCls) {
        throw new Error("Receiver does not have a class");
    }
    const superStruct = Buffer.alloc(16);
    superStruct.writeBigUInt64LE(BigInt(receiver), 0); // .receiver
    superStruct.writeBigUInt64LE(BigInt(superCls), 8); // .super_class
    const defArgs: FFIType[] = [FFIType.u64, FFIType.u64];
    const callArgs: any[] = [ptr(superStruct), selector];
    for (const { type, value } of args) {
        defArgs.push(type);
        callArgs.push(value);
    }
    return dlopen(foundationFrameworkPath, {
        objc_msgSendSuper: {
            args: defArgs,
            returns: returnType,
        },
    }).symbols.objc_msgSendSuper(...callArgs);
}

// There's only `referenceBuf` but not `reference`
// Caller should cache returned buffer then call `ptr(buf)`,
// to prevent buffer being GCed before or during the call
function referenceBuf(type: FFITypeOrString | ObjCType, value: any): Buffer {
    let buf: Buffer;
    switch (type) {
        case FFIType.bool:
            buf = Buffer.alloc(1)
            buf.writeInt8(value ? 1 : 0);
            break;
        case FFIType.i8:
            buf = Buffer.alloc(1)
            buf.writeInt8(Number(value));
            break;
        case FFIType.u8:
            buf = Buffer.alloc(1)
            buf.writeUInt8(Number(value));
            break;
        case FFIType.i16:
            buf = Buffer.alloc(2)
            buf.writeInt16LE(Number(value));
            break;
        case FFIType.u16:
            buf = Buffer.alloc(2)
            buf.writeUInt16LE(Number(value));
            break;
        case FFIType.i32:
            buf = Buffer.alloc(4)
            buf.writeInt32LE(Number(value));
            break;
        case FFIType.u32:
            buf = Buffer.alloc(4)
            buf.writeUInt32LE(Number(value));
            break;
        case FFIType.u64:
            buf = Buffer.alloc(8)
            buf.writeBigUInt64LE(BigInt(value));
            break;
        case FFIType.i64:
            buf = Buffer.alloc(8)
            buf.writeBigInt64LE(BigInt(value));
            break;
        case FFIType.cstring:
            return Buffer.from(value.toString() + "\0");
        case FFIType.f32:
            buf = Buffer.alloc(4)
            buf.writeFloatLE(Number(value));
            break;
        case FFIType.f64:
            buf = Buffer.alloc(8)
            buf.writeDoubleLE(Number(value));
            break;
        case FFIType.ptr:
            buf = Buffer.alloc(8)
            buf.writeBigUInt64LE(BigInt(value));
            break;
        case FFIType.buffer:
            buf = Buffer.from(value);
            break;
        case ObjCType.cstruct:
            buf = value;
            break;
        case FFIType.function:
            if (value instanceof JSCallback) {
                buf = Buffer.alloc(8)
                buf.writeBigUInt64LE(BigInt(value.ptr ?? 0));
            } else {
                buf = Buffer.alloc(8)
                buf.writeBigUInt64LE(BigInt(value));
            }
            break;
        default:
            return value
    }
    return buf;
}

function dereference(type: FFITypeOrString | ObjCType, buf: Buffer): any {
    switch (type) {
        case "bool":
        case FFIType.bool:
            return !!buf.readUInt8(0);
        case "char":
        case FFIType.char:
            return String.fromCharCode(buf.readUInt8(0));
        case "i8":
        case FFIType.i8:
            return buf.readInt8(0);
        case "u8":
        case FFIType.u8:
            return buf.readUInt8(0);
        case "i16":
        case FFIType.i16:
            return buf.readInt16LE(0);
        case "u16":
        case FFIType.u16:
            return buf.readUInt16LE(0);
        case "i32":
        case FFIType.i32:
            return buf.readInt32LE(0);
        case "u32":
        case FFIType.u32:
            return buf.readUInt32LE(0);
        case "u64":
        case FFIType.u64:
            return buf.readBigUInt64LE(0);
        case "i64":
        case FFIType.i64:
            return buf.readBigInt64LE(0);
        case "cstring":
        case FFIType.cstring:
            return buf.toString("utf8").replace(/[\0]*$/g, "");
        case "f32":
        case FFIType.f32:
            return buf.readFloatLE(0);
        case "f64":
        case FFIType.f64:
            return buf.readDoubleLE(0);
        case "ptr":
        case FFIType.ptr:
            return buf.readBigUInt64LE(0);
        // case ObjCType.class: [TODO]
        // case FFIType.buffer: // oh this is problematic, no one paid me so nothing here :(
        case "function":
        case FFIType.function:
            return buf.readBigUInt64LE(0); // :(
        default:
            return buf.readBigUInt64LE(0); // :(
    }
}

// Recursively extract all primitive field types from a struct type encoding string.
// e.g. "{CGRect={CGPoint=dd}{CGSize=dd}}" → [f64, f64, f64, f64]
function parseStructFields(encoding: string): (ObjCType | FFIType)[] {
    const fields: (ObjCType | FFIType)[] = [];
    function parse(enc: string, pos: number): number {
        while (pos < enc.length) {
            const c = enc[pos]!;
            if (c === '}' || c === ')') return pos + 1;
            if (c === '{' || c === '(') {
                // nested struct/union: skip name, find '=', recurse into fields
                pos++;
                while (pos < enc.length && enc[pos] !== '=' && enc[pos] !== '}' && enc[pos] !== ')') pos++;
                if (pos < enc.length && enc[pos] === '=') pos = parse(enc, pos + 1);
            } else if (c === '[') {
                // array: skip entirely
                while (pos < enc.length && enc[pos] !== ']') pos++;
                pos++;
            } else if (c === '"') {
                // field name in quotes: skip
                pos++;
                while (pos < enc.length && enc[pos] !== '"') pos++;
                pos++;
            } else if (c === '^') {
                // pointer: always a u64 regardless of the pointed-to type
                fields.push(FFIType.u64);
                pos++;
                if (pos < enc.length && enc[pos] !== '}' && enc[pos] !== ')') pos++;
            } else {
                const ffiType = TypeEncodingToFFITypeMap[c];
                if (ffiType !== undefined) fields.push(ffiType as FFIType);
                pos++;
            }
        }
        return pos;
    }
    // Skip the outer "{Name=" prefix and recurse into the fields
    if (encoding.startsWith('{')) {
        let pos = 1;
        while (pos < encoding.length && encoding[pos] !== '=' && encoding[pos] !== '}') pos++;
        if (pos < encoding.length && encoding[pos] === '=') parse(encoding, pos + 1);
    }
    return fields;
}

// An HFA (Homogeneous Floating-point Aggregate) is 1–4 elements all of the same float type.
// On ARM64 ABI these are passed in v0–v3 floating-point registers, not general-purpose registers.
function isHFA(fields: (ObjCType | FFIType)[]): boolean {
    if (fields.length < 1 || fields.length > 4) return false;
    const base = fields[0];
    if (base !== FFIType.f32 && base !== FFIType.f64) return false;
    return fields.every(f => f === base);
}

// (Impossible) [FIXME]: if a method contains both by-value HFA struct & by-value non-HFA complex struct...
export function ns_invoke(returnType: ObjCType | FFITypeOrString, receiver: ObjCObject | typeof ObjCClass, selector: ObjCSelector | FFITypeToArgsType[FFIType.u64], ...args: VariadicInvocationArg[]): unknown {
    assertFoundation(foundation);
    const sel = (str: string) => foundation!.sel_registerName(Buffer.from(str + "\0"));
    const receiverPtr = msgReceiverPtr(receiver);
    const selectorPtr = selPtr(selector);
    const signature = raw_msgSend(FFIType.u64, receiverPtr, sel("methodSignatureForSelector:"), { type: FFIType.u64, value: selectorPtr }) as bigint;

    // Fast path: if the return type is not a struct, check whether every cstruct arg is an HFA.
    // If so, decompose each HFA buffer into individual f64/f32 values and call objc_msgSend
    // directly. This avoids NSInvocation's arm64 getArgument:atIndex: +312 crash, which occurs
    // because its internal call-frame builder allocates 8-byte slots (register width) for ALL
    // arguments, then calls getArgument:atIndex: with those 8-byte buffers. __NSI1 validation
    // then fails for any HFA > 8 bytes (e.g. CGRect = 4×f64 = 32 bytes).
    if (returnType !== ObjCType.cstruct) {
        const flatArgs: VariadicInvocationArg[] = [];
        let canBypass = true;
        for (let i = 0; i < args.length; i++) {
            const { type, value } = args[i]!;
            if (type === ObjCType.cstruct) {
                const encoding = (raw_msgSend(FFIType.cstring, signature, sel("getArgumentTypeAtIndex:"), { type: FFIType.u64, value: BigInt(i + 2) }) as any)?.toString() as string | undefined;
                if (encoding) {
                    const fields = parseStructFields(encoding);
                    if (isHFA(fields)) {
                        const buf = value as Buffer;
                        let offset = 0;
                        for (const field of fields) {
                            if (field === FFIType.f64) {
                                flatArgs.push({ type: FFIType.f64, value: buf.readDoubleLE(offset) });
                                offset += 8;
                            } else {
                                flatArgs.push({ type: FFIType.f32, value: buf.readFloatLE(offset) });
                                offset += 4;
                            }
                        }
                        continue;
                    }
                }
                canBypass = false;
            }
            flatArgs.push({ type, value });
        }
        if (canBypass) {
            return objc_msgSend(returnType, receiver, selector, ...flatArgs);
        }
    }

    // NSInvocation fallback: used for non-HFA struct args or struct return types.
    const NSInvocationCls = foundation.objc_getClass(Buffer.from("NSInvocation\0"))!;
    const invocation = raw_msgSend(FFIType.u64, NSInvocationCls, sel("invocationWithMethodSignature:"), { type: FFIType.u64, value: signature }) as bigint;
    raw_msgSend(FFIType.void, invocation, sel("setTarget:"), { type: FFIType.u64, value: receiverPtr });
    raw_msgSend(FFIType.void, invocation, sel("setSelector:"), { type: FFIType.u64, value: selectorPtr });
    const bufs: Buffer[] = [];
    args.forEach(({ type, value }, index) => {
        const buf = referenceBuf(type, value);
        bufs.push(buf);
        raw_msgSend(FFIType.void, invocation, sel("setArgument:atIndex:"), { type: FFIType.ptr, value: ptr(buf) }, { type: FFIType.i64, value: BigInt(index + 2) });
    });
    raw_msgSend(FFIType.void, invocation, sel("invoke"));
    const len = raw_msgSend(FFIType.u64, signature, sel("methodReturnLength")) as bigint;
    const retBuf = Buffer.alloc(Number(len));
    raw_msgSend(FFIType.void, invocation, sel("getReturnValue:"), { type: FFIType.ptr, value: ptr(retBuf) });
    const val = dereference(returnType, retBuf);
    return isObjCType(returnType) ? translateFromForeign(val, returnType) : val;
}

export function objc_msgSend(returnType: ObjCType | FFITypeOrString, receiver: ObjCObject | typeof ObjCClass, selector: ObjCSelector | FFITypeToArgsType[FFIType.u64], ...args: VariadicInvocationArg[]): unknown {
    assertFoundation(foundation);
    const initArgs: VariadicInvocationArg[] = [{ type: ObjCType.id, value: receiver }, { type: ObjCType.selector, value: selector }];
    const { defArgs, callArgs } = dispatchVariadicInvocationArgs(initArgs.concat(args));
    const FFIreturnType = isObjCType(returnType) ? objcTypeToFFIType(returnType) : returnType;
    if (callArgs[0] === undefined || callArgs[0] === null) {
        return null;
    }
    const res = dlopen(foundationFrameworkPath, {
        objc_msgSend: {
            args: defArgs,
            returns: FFIreturnType,
        },
    }).symbols.objc_msgSend(...callArgs);
    return isObjCType(returnType) ? translateFromForeign(res, returnType) : res;
}

export function method_invoke(returnType: ObjCType | FFITypeOrString, receiver: ObjCObject | typeof ObjCClass, method: FFITypeToArgsType[FFIType.u64], ...args: VariadicInvocationArg[]): any {
    assertFoundation(foundation);
    const initArgs: VariadicInvocationArg[] = [{ type: ObjCType.id, value: receiver }, { type: ObjCType.method, value: method }];
    const { defArgs, callArgs } = dispatchVariadicInvocationArgs(initArgs.concat(args));
    const FFIreturnType = isObjCType(returnType) ? objcTypeToFFIType(returnType) : returnType;
    const res = dlopen(foundationFrameworkPath, {
        method_invoke: {
            args: defArgs,
            returns: FFIreturnType,
        },
    }).symbols.method_invoke(...callArgs);
    return isObjCType(returnType) ? translateFromForeign(res, returnType) : res;
}

function whichFuncForInvoke(returnType: ObjCType | FFITypeOrString, argTypes?: (ObjCType | FFITypeOrString)[]): typeof ns_invoke | typeof objc_msgSend {
    return returnType === ObjCType.cstruct || argTypes?.includes(ObjCType.cstruct)
        ? ns_invoke
        : objc_msgSend;
}

function whichFuncForInvokeInString(returnType: ObjCType | FFITypeOrString, argTypes?: (ObjCType | FFITypeOrString)[]): "ns_invoke" | "objc_msgSend" {
    return returnType === ObjCType.cstruct || argTypes?.includes(ObjCType.cstruct)
        ? "ns_invoke"
        : "objc_msgSend";
}

///// ObjC Type

export enum ObjCType {
    class = 0x1000,
    selector = 0x1001,
    id = 0x1002,
    method = 0x1003,
    protocol = 0x1004,
    ivar = 0x1005,
    property = 0x1006,
    imp = 0x1007,
    property_attribute = 0x2000,
    method_description = 0x2001,
    // They should not be here :(
    cstruct = 0x3000,
}

export function isObjCType(type: any): type is ObjCType {
    return Object.values(ObjCType).includes(type);
}

export const TypeEncodingToFFITypeMap: Record<string, ObjCType | FFITypeOrString> = {
    "c": FFIType.i8,
    "i": FFIType.i32,
    "s": FFIType.i16,
    "l": FFIType.i64,
    "q": FFIType.i64,
    "C": FFIType.u8,
    "I": FFIType.u32,
    "S": FFIType.u16,
    "L": FFIType.u64,
    "Q": FFIType.u64,
    "f": FFIType.f32,
    "d": FFIType.f64,
    "B": FFIType.bool,
    "*": FFIType.cstring,
    "@": ObjCType.id,
    "#": ObjCType.class,
    ":": ObjCType.selector,
    "v": FFIType.void,
    "{": ObjCType.cstruct,
}

export const FFITypeToTypeEncodingMap: Record<ObjCType | FFITypeOrString, string> = {
    [FFIType.i8]: "c",
    "i8": "c",
    [FFIType.char]: "c",
    "char": "c",
    [FFIType.i16]: "s",
    "i16": "s",
    [FFIType.i32]: "i",
    "i32": "i",
    [FFIType.i64]: "q",
    "i64": "q",
    [FFIType.u8]: "C",
    "u8": "C",
    [FFIType.u32]: "I",
    "u32": "I",
    [FFIType.u16]: "S",
    "u16": "S",
    [FFIType.u64]: "L",
    "u64": "L",
    [FFIType.f32]: "f",
    "f32": "f",
    [FFIType.f64]: "d",
    "f64": "d",
    [FFIType.bool]: "B",
    "bool": "B",
    [FFIType.cstring]: "*",
    "cstring": "*",
    [ObjCType.id]: "@",
    [ObjCType.class]: "#",
    [ObjCType.selector]: ":",
    [FFIType.void]: "v",
    "void": "v",
    [ObjCType.cstruct]: "{", // actually needs the full struct encoding...
    "function": "L",
    [ObjCType.method]: "",
    [ObjCType.protocol]: "",
    [ObjCType.ivar]: "",
    [ObjCType.property]: "",
    [ObjCType.imp]: "",
    [ObjCType.property_attribute]: "",
    [ObjCType.method_description]: "",
    [FFIType.ptr]: "",
    [FFIType.i64_fast]: "",
    [FFIType.u64_fast]: "",
    [FFIType.function]: "",
    [FFIType.napi_env]: "",
    [FFIType.napi_value]: "",
    [FFIType.buffer]: "",
    int8_t: "c",
    uint8_t: "C",
    int16_t: "s",
    uint16_t: "S",
    int32_t: "i",
    int: "i",
    uint32_t: "I",
    int64_t: "q",
    uint64_t: "Q",
    double: "d",
    float: "f",
    ptr: "L",
    pointer: "L",
    usize: "L",
    callback: "L",
    napi_env: "L",
    napi_value: "L",
    buffer: "L",
}

// [FIXME] temp solution
function parseTypeEncoding(typeEncoding: string): ObjCType | FFITypeOrString {
    typeEncoding = typeEncoding.replace(/^[rnNoORV]*/g, ""); // ignore type qualifiers
    if (typeEncoding.length === 0) {
        return FFIType.void;
    }
    let type = TypeEncodingToFFITypeMap[typeEncoding[0]!];
    if (type === undefined) {
        return FFIType.u64; // default to ptr for unknown types
    }
    return type;
}

// [FIXME] temp solution
function toTypeEncoding(type: ObjCType | FFITypeOrString): string {
    return FFITypeToTypeEncodingMap[type];
}

//// Type translation

const ObjCTypeToFFITypeMap: Record<ObjCType, ObjCFFIType | FFIType> = {
    [ObjCType.class]: ObjCFFIType.class,
    [ObjCType.selector]: ObjCFFIType.selector,
    [ObjCType.id]: ObjCFFIType.id,
    [ObjCType.method]: ObjCFFIType.method,
    [ObjCType.protocol]: ObjCFFIType.protocol,
    [ObjCType.ivar]: ObjCFFIType.ivar,
    [ObjCType.property]: ObjCFFIType.property,
    [ObjCType.imp]: ObjCFFIType.imp,
    [ObjCType.property_attribute]: ObjCFFIType.property_attribute,
    [ObjCType.method_description]: ObjCFFIType.method_description,
    [ObjCType.cstruct]: FFIType.buffer,
}

function objcTypeToFFIType(type: ObjCType): ObjCFFIType | FFIType {
    return ObjCTypeToFFITypeMap[type] || FFIType.u64;
}

function ffiTypeToObjCType(type: ObjCFFIType | FFIType): ObjCType | undefined {
    for (const [key, value] of Object.entries(ObjCTypeToFFITypeMap)) {
        if (value === type) {
            return parseInt(key) as ObjCType;
        }
    }
}

// Used for filling FFI Fns for msgSend and method_invoke in runtime
const typeToReturnTypeMap: Record<ObjCType | FFIType, string | number> = {
    [ObjCType.class]: ObjCType.class,
    [ObjCType.selector]: ObjCType.selector,
    [ObjCType.id]: ObjCType.id,
    [ObjCType.method]: ObjCType.method,
    [ObjCType.protocol]: ObjCType.protocol,
    [ObjCType.ivar]: ObjCType.ivar,
    [ObjCType.property]: ObjCType.property,
    [ObjCType.imp]: ObjCType.imp,
    [ObjCType.property_attribute]: ObjCType.property_attribute,
    [ObjCType.method_description]: ObjCType.method_description,
    [ObjCType.cstruct]: ObjCType.cstruct,

    // 30Mar26 Copied
    [FFIType.char]: "char",
    [FFIType.int8_t]: "i8",
    [FFIType.uint8_t]: "u8",
    [FFIType.int16_t]: "i16",
    [FFIType.uint16_t]: "u16",
    [FFIType.int32_t]: "i32",
    [FFIType.uint32_t]: "u32",
    [FFIType.int64_t]: "i64",
    [FFIType.uint64_t]: "u64",
    [FFIType.double]: "f64",
    [FFIType.float]: "f32",
    [FFIType.bool]: "bool",
    [FFIType.ptr]: "u64",
    [FFIType.void]: "void",
    [FFIType.cstring]: "cstring",
    [FFIType.i64_fast]: "i64",
    [FFIType.u64_fast]: "u64",
    [FFIType.function]: "u64",
    [FFIType.napi_env]: "napi_env",
    [FFIType.napi_value]: "napi_value",
    [FFIType.buffer]: "buffer",
}

// Used for filling FFI Fns for msgSend and method_invoke in generated TypeScript
const typeToArgsTypeTypeScriptTypeStringMap: Record<ObjCType | ObjCFFIType | FFIType, string> = {
    [ObjCType.class]: "ObjCClass | null",
    [ObjCType.selector]: "ObjCSelector | null",
    [ObjCType.id]: "ObjCId | null",
    [ObjCType.method]: "Function | null",
    [ObjCType.protocol]: "ObjCObject | null",
    [ObjCType.ivar]: "ObjCObject | null",
    [ObjCType.property]: "ObjCObject | null",
    [ObjCType.imp]: "ObjCObject | null",
    [ObjCType.property_attribute]: "ObjCObject | null",
    [ObjCType.method_description]: "ObjCObject | null",
    [ObjCType.cstruct]: "Object | null",

    [ObjCFFIType.class]: "ObjCClass | null",
    [ObjCFFIType.property_attribute]: "FFITypeToArgsType[FFIType.buffer]",

    [FFIType.char]: "FFITypeToArgsType[FFIType.char]",
    [FFIType.int8_t]: "FFITypeToArgsType[FFIType.int8_t]",
    [FFIType.uint8_t]: "FFITypeToArgsType[FFIType.uint8_t]",
    [FFIType.int16_t]: "FFITypeToArgsType[FFIType.int16_t]",
    [FFIType.uint16_t]: "FFITypeToArgsType[FFIType.uint16_t]",
    [FFIType.int32_t]: "FFITypeToArgsType[FFIType.int32_t]",
    [FFIType.uint32_t]: "FFITypeToArgsType[FFIType.uint32_t]",
    [FFIType.int64_t]: "FFITypeToArgsType[FFIType.int64_t]",
    [FFIType.uint64_t]: "FFITypeToArgsType[FFIType.uint64_t]",
    [FFIType.double]: "FFITypeToArgsType[FFIType.double]",
    [FFIType.float]: "FFITypeToArgsType[FFIType.float]",
    [FFIType.bool]: "FFITypeToArgsType[FFIType.bool]",
    [FFIType.ptr]: "FFITypeToArgsType[FFIType.ptr]",
    [FFIType.void]: "FFITypeToArgsType[FFIType.void]",
    [FFIType.cstring]: "FFITypeToArgsType[FFIType.cstring]",
    [FFIType.i64_fast]: "FFITypeToArgsType[FFIType.i64_fast]",
    [FFIType.u64_fast]: "FFITypeToArgsType[FFIType.u64_fast]",
    [FFIType.function]: "FFITypeToArgsType[FFIType.function]",
    [FFIType.napi_env]: "FFITypeToArgsType[FFIType.napi_env]",
    [FFIType.napi_value]: "FFITypeToArgsType[FFIType.napi_value]",
    [FFIType.buffer]: "FFITypeToArgsType[FFIType.buffer]",
}

// Used for filling FFI Fns for msgSend and method_invoke in generated TypeScript
const typeToReturnTypeTypeScriptTypeStringMap: Record<ObjCType | ObjCFFIType | FFIType, string> = {
    [ObjCType.class]: "ObjCClass | null",
    [ObjCType.selector]: "ObjCSelector | null",
    [ObjCType.id]: "ObjCId | null",
    [ObjCType.method]: "Function | null",
    [ObjCType.protocol]: "ObjCObject | null",
    [ObjCType.ivar]: "ObjCObject | null",
    [ObjCType.property]: "ObjCObject | null",
    [ObjCType.imp]: "ObjCObject | null",
    [ObjCType.property_attribute]: "ObjCObject | null",
    [ObjCType.method_description]: "ObjCObject | null",
    [ObjCType.cstruct]: "Object | null",
    [ObjCFFIType.class]: "ObjCClass | null",
    [ObjCFFIType.property_attribute]: "FFITypeToReturnsType[FFIType.buffer]",

    [FFIType.char]: "FFITypeToReturnsType[FFIType.char]",
    [FFIType.int8_t]: "FFITypeToReturnsType[FFIType.int8_t]",
    [FFIType.uint8_t]: "FFITypeToReturnsType[FFIType.uint8_t]",
    [FFIType.int16_t]: "FFITypeToReturnsType[FFIType.int16_t]",
    [FFIType.uint16_t]: "FFITypeToReturnsType[FFIType.uint16_t]",
    [FFIType.int32_t]: "FFITypeToReturnsType[FFIType.int32_t]",
    [FFIType.uint32_t]: "FFITypeToReturnsType[FFIType.uint32_t]",
    [FFIType.int64_t]: "FFITypeToReturnsType[FFIType.int64_t]",
    [FFIType.uint64_t]: "FFITypeToReturnsType[FFIType.uint64_t]",
    [FFIType.double]: "FFITypeToReturnsType[FFIType.double]",
    [FFIType.float]: "FFITypeToReturnsType[FFIType.float]",
    [FFIType.bool]: "FFITypeToReturnsType[FFIType.bool]",
    [FFIType.ptr]: "FFITypeToReturnsType[FFIType.ptr]",
    [FFIType.void]: "FFITypeToReturnsType[FFIType.void]",
    [FFIType.cstring]: "FFITypeToReturnsType[FFIType.cstring]",
    [FFIType.i64_fast]: "FFITypeToReturnsType[FFIType.i64_fast]",
    [FFIType.u64_fast]: "FFITypeToReturnsType[FFIType.u64_fast]",
    [FFIType.function]: "FFITypeToReturnsType[FFIType.function]",
    [FFIType.napi_env]: "FFITypeToReturnsType[FFIType.napi_env]",
    [FFIType.napi_value]: "FFITypeToReturnsType[FFIType.napi_value]",
    [FFIType.buffer]: "FFITypeToReturnsType[FFIType.buffer]",
}

function typeToReturnType(type: ObjCType | FFITypeOrString): string | number {
    if (typeof type === "string") {
        return type;
    }
    const str = typeToReturnTypeMap[type];
    return str === undefined ? "pointer" : str;
}

function typeToArgsTypeTypeScriptTypeString(type: ObjCType | ObjCFFIType | FFITypeOrString): string {
    if (typeof type === "string") {
        return "FFITypeToArgsType[FFITypeStringToType[type]]"
    }
    const str = typeToArgsTypeTypeScriptTypeStringMap[type];
    return str === undefined ? "NodeJS.TypedArray | Pointer | CString | null" : str;
}

function typeToReturnTypeTypeScriptTypeString(type: ObjCType | ObjCFFIType | FFITypeOrString): string {
    if (typeof type === "string") {
        return "FFITypeToReturnsType[FFITypeStringToType[type]]";
    }
    const str = typeToReturnTypeTypeScriptTypeStringMap[type];
    return str === undefined ? "Pointer | null" : str;
}

//// Object translation

function isInstanceType(ptr: FFITypeToArgsType[FFIType.u64]): boolean {
    // class: the object's class's class is a metaclass;
    // instancetype: the object's class's class is NOT a metaclass.
    let cls = foundation!.object_getClass(ptr);
    if (!cls) {
        throw new ReferenceError(`Failed to get class of object pointer ${ptr}.`);
    }
    let meta = foundation!.object_getClass(cls);
    if (!meta) {
        throw new ReferenceError(`Failed to get metaclass of class pointer ${cls}.`);
    }
    return !foundation!.class_isMetaClass(meta);
}

function translateFromForeign(res: unknown, type: ObjCType | FFIType): unknown {
    assertFoundation(foundation);
    if (res == 0) return null;
    switch (type) {
        case ObjCType.class:
            return findObjCClass(res as bigint);
        case ObjCType.selector:
            return findObjCSelector(res as bigint);
        case ObjCType.id:
            if (isInstanceType(res as bigint)) {
                const instance = foundation!.object_getClass(res as bigint);
                const cls = findObjCClass(foundation!.object_getClass(instance));
                return new cls(instance);
            } else {
                const cls = findObjCClass(foundation!.object_getClass(res as bigint));
                return new cls(res as bigint);
            }
        case ObjCType.method:
            return new InstanceMethodVomitter(res as bigint).vomitToObject();
        default:
            return res;
    }
}

function translateToForeign(arg: unknown, type: ObjCType | FFITypeOrString): unknown {
    assertFoundation(foundation);
    if (arg === null || arg === undefined) {
        return 0n;
    } else if (typeof arg === "object" && (arg as any).__ts_objc_ptr !== undefined) {
        return (arg as any).__ts_objc_ptr;
    } else if (isObjCType(type)) {
        if (typeof arg === "bigint") {
            return arg;
        } else if (type === ObjCType.selector && typeof arg === "string") {
            return foundation.sel_registerName(Buffer.from(arg + "\0"));
        } else if (type === ObjCType.class && typeof arg === "string") {
            const ptr = foundation.objc_getClass(Buffer.from(arg + "\0"));
            if (ptr === null || ptr === undefined) {
                throw new ReferenceError(`Obj-C class ${arg} not found.`);
            }
            return ptr;
        } else {
            return _NS.toObj(arg as NSAcceptable)?.__ts_objc_ptr ?? 0n;
        }
    } else {
        return arg;
    }
}

//// ObjC Object

export class ObjCObject {
    __ts_objc_ptr: FFITypeToArgsType[FFIType.u64];
    constructor(ptr: FFITypeToArgsType[FFIType.u64]) {
        this.__ts_objc_ptr = ptr;
    }

    // Agent gave smth useful here
    [Symbol.for("nodejs.util.inspect.custom")]() {
        const clsName = foundation?.object_getClassName(this.__ts_objc_ptr)?.toString() ?? "ObjCObject";
        const ptrHex = BigInt(this.__ts_objc_ptr).toString(16);
        return `<${clsName} 0x${ptrHex}>`;
    }
}

export class ObjCSelector extends ObjCObject {
    static selectors: Record<string, ObjCSelector> = {};
    __ts_objc_name: string;
    constructor(nameOrPtr: string | FFITypeToArgsType[FFIType.u64]) {
        assertFoundation(foundation);
        if (typeof nameOrPtr === "string") {
            const ptr = foundation.sel_registerName(Buffer.from(nameOrPtr + "\0"));
            if (ptr === null || ptr === undefined) {
                throw new Error(`Failed to register selector ${nameOrPtr}.`); // sel_registerName should never fail, but just in case
            }
            super(ptr);
        } else {
            super(nameOrPtr);
        }
        let name = foundation.sel_getName(this.__ts_objc_ptr)?.toString();
        if (name === undefined) {
            throw new Error("Failed to get selector name.");
        }
        this.__ts_objc_name = name;
    }
}

export class ObjCId extends ObjCObject {
    __ts_objc_class: FFITypeToArgsType[FFIType.u64];
    [key: string]: Function | unknown | undefined | any;
    constructor(id: FFITypeToArgsType[FFIType.u64]) {
        super(id);
        assertFoundation(foundation);
        const clsPtr = foundation.object_getClass(id);
        if (clsPtr === null || clsPtr === undefined) {
            throw new ReferenceError(`Failed to get class of object pointer ${id}.`);
        }
        this.__ts_objc_class = clsPtr;
    }
}

class _ObjCClass extends ObjCId {
    static __ts_objc_name: string;
    static __ts_objc_ptr: FFITypeToArgsType[FFIType.u64];
    static __ts_objc_meta: FFITypeToArgsType[FFIType.u64];
    constructor(id: string | FFITypeToArgsType[FFIType.u64]) {
        if (typeof id === "string") {
            // [TODO] test it
            assertFoundation(foundation);
            const ptr = foundation.objc_getClass(Buffer.from(id + "\0"));
            if (ptr === null || ptr === undefined) {
                throw new ReferenceError(`Obj-C class ${id} not found.`);
            }
            const cls = findObjCClass(ptr)
            return new cls(ptr)
        } else {
            super(id);
        }
    }
}
const _ObjCIdHandler: ProxyHandler<ObjCClass> = {
    get(target, prop) {
        if (prop.toString().startsWith("__ts_objc_")) {
            return target[prop.toString()];
        }
        assertFoundation(foundation);
        const sel = prop.toString().replace(/(?<!^_*)_+/g, ":");
        if (sel in target) {
            return target[sel];
        }
        const propPtr = foundation.class_getProperty(target.__ts_objc_class, Buffer.from(sel + "\0"))
        if (propPtr) {
            const vomitter = new PropertyVomitter(propPtr, target.__ts_objc_class);
            vomitter.vomitToObject()(target.constructor.prototype as ObjCClass);
            return target[sel];
        }
        const methodPtr = foundation.class_getInstanceMethod(target.__ts_objc_class, foundation.sel_registerName(Buffer.from(sel + "\0")));
        if (methodPtr) {
            const vomitter = new InstanceMethodVomitter(methodPtr, target.__ts_objc_class);
            target.constructor.prototype[sel] = vomitter.vomitToObject();
            return target[sel];
        }
        return undefined;
    }
}

const _ObjCClassHandler: ProxyHandler<typeof _ObjCClass> = {
    construct(target, args) {
        assertFoundation(foundation);
        return new Proxy(new target(args[0]), _ObjCIdHandler) as unknown as ObjCId
            & InstanceType<typeof _ObjCClass>
    }
}

class _ObjCClassMetaObject extends ObjCId {
    __ts_objc_name: string;
    __ts_objc_meta: FFITypeToArgsType[FFIType.u64];
    // a virtual one
    constructor(nameOrPtr: string | FFITypeToArgsType[FFIType.u64]) {
        super(0);
        this.__ts_objc_name = "";
        this.__ts_objc_meta = 0;
    }
}

export const ObjCClass = new Proxy(_ObjCClass, _ObjCClassHandler) as unknown as _ObjCClassMetaObject
    & (new (...args: any[]) => ObjCId & InstanceType<typeof _ObjCClass>);

export type ObjCClass = InstanceType<typeof ObjCClass>;

const _ObjCMetaClassHandler: ProxyHandler<typeof _ObjCClass> = {
    get(target, prop) {
        if (prop.toString().startsWith("__ts_objc_")) {
            return (target as any)[prop];
        }
        assertFoundation(foundation);
        const sel = prop.toString().replace(/(?<!^_*)_+/g, ":");
        if (sel in target) {
            return (target as any)[sel];
        }
        const classPropPtr = foundation.class_getProperty(target.__ts_objc_meta, Buffer.from(sel + "\0"))
        if (classPropPtr > 0) {
            const vomitter = new PropertyVomitter(classPropPtr, target.__ts_objc_ptr);
            vomitter.vomitToObject()(target)
            return (target as any)[sel];
        }
        const classMethodPtr = foundation.class_getClassMethod(target.__ts_objc_ptr, foundation.sel_registerName(Buffer.from(sel + "\0")));
        if (classMethodPtr > 0) {
            const vomitter = new ClassMethodVomitter(classMethodPtr, target.__ts_objc_ptr);
            (target as any)[sel] = vomitter.vomitToObject();
            return (target as any)[sel];
        }
    }
}

function lookupObjCClass<Base extends typeof ObjCClass>(base: Base, ptr: FFITypeToArgsType[FFIType.u64], name: string, meta: FFITypeToArgsType[FFIType.u64]) {
     return new Proxy(class extends base {
        static override __ts_objc_name: string = name;
        static override __ts_objc_ptr: FFITypeToArgsType[FFIType.u64] = ptr;
        static override __ts_objc_meta: FFITypeToArgsType[FFIType.u64] = meta;
        constructor(...args: any[]) {
            super(...args);
        }
    }, _ObjCMetaClassHandler) as typeof ObjCClass;
}

//// Subclassing

/**
 * Definition of a new method
 *
 * Used when subclassing.
 * 
 * The method selector is the splicing of the name field and its argument names.
 */
export interface ObjCMethodDefinition {
    /**
     * Method "name". The name of method if no arguments, or the part before the first colon if has arguments. 
     * 
     * It can be empty if the method name starts with arguments (e.g. `- (void):arg1 arg2:(int)arg2`), but must not contain colons.
     */
    name?: string;
    /**
     * List of arguments. The selector of the method will be the splicing of the name and argument names. 
     * 
     * E.g. if name is "doSomething" and args is [{name: "with", type: ObjCType.id}], then the selector will be "doSomething:with:"
     */
    args: ({
        name?: string;
        type: ObjCType | FFITypeOrString;
    })[];
    /**
     * Return type of the method
     */
    returnType: ObjCType | FFITypeOrString;
    /**
     * Method implementation. 
     * 
     * `this` will be bound to the receiver.
     */
    impl: (...args: any[]) => any;
}

/**
 * Definition of a new property
 *
 * Used when subclassing
 */
export interface ObjCPropertyDefinition {
    /**
     * Property name. Must not conflict with existing properties, but can be same with method names
     * 
     * Method that has the same name will be treated as the getter of the property and kicked out in JS side
     */
    name: string;
    /**
     * Property type
     */
    type: ObjCType | FFITypeOrString;
    /**
     * Getter name. Define it with ObjCMethodDefinition
     */
    getter?: string;
    /**
     * Setter name. Define it with ObjCMethodDefinition
     */
    setter?: string;
    /**
     * Whether the property is readonly. Default to false.
     */
    readonly?: boolean;
    /**
     * Name of the instance variable backing the property.
     */
    ivarName?: string;
    /**
     * The property is a copy of the value last assigned (copy).
     */
    copy?: boolean;
    /**
     * The property is a reference to the value last assigned (retain).
     */
    retain?: boolean;
    /**
     * The property is not guaranteed to be thread safe (nonatomic).
     */
    nonAtomic?: boolean;
    /**
     * The property is dynamic (@dynamic).
     */
    dynamic?: boolean;
    /**
     * The property is a weak reference (__weak).
     */
    weak?: boolean;
    /**
     * The property is eligible for garbage collection.
     */
    gc?: boolean;
}

/**
 * Definition of a new class
 *
 * Used when subclassing
 */
export interface ObjCClassDefinition {
    /**
     * New class name. Must not conflict with existing classes.
     */
    name: string;
    /**
     * Superclass, default to NSObject.
     */
    superClass?: typeof ObjCClass | string;
    /**
     * List of protocols the class conforms to.
     */
    protocols?: string[];
    /**
     * List of class methods.
     */
    classMethods?: ObjCMethodDefinition[];
    /**
     * List of instance methods.
     */
    instanceMethods?: ObjCMethodDefinition[];
    /**
     * List of class properties.
     */
    classProperties?: ObjCPropertyDefinition[];
    /**
     * List of instance properties.
     */
    instanceProperties?: ObjCPropertyDefinition[];
}

/**
 * Create new Obj-C class
 * @param def Definition of new class
 * @returns The new class
 */
export function subclassing(def: ObjCClassDefinition): typeof ObjCClass {
    assertFoundation(foundation);
    const { name, superClass = "NSObject", protocols = [], classMethods = [], instanceMethods = [], classProperties = [], instanceProperties = [] } = def;
    let superPtr: FFITypeToArgsType[FFIType.u64];
    if (typeof superClass === "string") {
        superPtr = foundation.objc_getClass(Buffer.from(superClass + "\0"));
        if (!superPtr) {
            throw new ReferenceError(`Superclass ${superClass} not found.`);
        }
    } else {
        superPtr = superClass.__ts_objc_ptr;
    }
    const superName = typeof superClass === "string" ? superClass : superClass.__ts_objc_name;
    const newClassPtr = foundation.objc_allocateClassPair(superPtr, Buffer.from(name + "\0"), 0);
    if (!newClassPtr) {
        throw new Error(`Failed to allocate subclass ${name} of ${superName}.`);
    }
    const metaClassPtr = foundation.object_getClass(newClassPtr);
    if (!metaClassPtr) {
        throw new ReferenceError(`Failed to get metaclass of newly allocated class ${name}.`);
    }
    const addMethod = (desc: ObjCMethodDefinition, isClassMethod: boolean) =>
    {
        assertFoundation(foundation);
        const { name: methodName = "", args = [], returnType, impl } = desc;
        const fullMethodName = methodName + args.map(arg => arg.name).join(":") + (args.length > 0 ? ":" : "");
        const sel = foundation.sel_registerName(Buffer.from(fullMethodName + "\0"));
        const typeEncoding = [returnType, ObjCType.id, ObjCType.selector, ...args.map(arg => arg.type)]
            .map(t => {
                return toTypeEncoding(t);
            }).join("");
        const argFFITypes = [FFIType.u64, FFIType.u64, ...args.map(arg => isObjCType(arg.type) ? objcTypeToFFIType(arg.type) : arg.type)];
        const returnFFIType = isObjCType(returnType) ? objcTypeToFFIType(returnType) : returnType;
        // [TODO] support calling super
        const imp = new JSCallback((self, _cmd, ...args) => {
            const jsArgs = args.map((arg, index) => {
                const argType = args[index];
                return isObjCType(argType) ? translateFromForeign(arg, argType) : arg;
            });
            const res = impl.bind(translateFromForeign(self, isClassMethod ? ObjCType.class : ObjCType.id))(...jsArgs);
            return isObjCType(returnType) ? translateToForeign(res, returnType) : res;
        }, {
            args: argFFITypes,
            returns: returnFFIType,
        }).ptr;
        if (!imp) {
            throw new Error(`Failed to create IMP for method ${methodName} of class ${name}.`);
        }
        const success = foundation.class_addMethod(newClassPtr, sel, imp, Buffer.from(typeEncoding + "\0"));
        if (!success) {
            throw new Error(`Failed to add method ${methodName} to class ${name}.`);
        }
    }
    const addProp = (desc: ObjCPropertyDefinition, isClassProperty: boolean) => {
        assertFoundation(foundation);
        const { name: propName, type, getter, setter, readonly, ivarName, copy, retain, nonAtomic, dynamic, weak, gc } = desc;
        const attributes = [];
        if (readonly) attributes.push("R");
        if (getter) { attributes.push("G" + getter); }
        if (setter) { attributes.push("S" + setter); }
        if (ivarName) { attributes.push("V" + ivarName); }
        if (copy) attributes.push("C");
        if (retain) attributes.push("&");
        if (nonAtomic) attributes.push("N");
        if (dynamic) attributes.push("D");
        if (weak) attributes.push("W");
        if (gc) attributes.push("P");
        attributes.unshift("T" + toTypeEncoding(type));
        const attrCount = attributes.length;
        const buf = Buffer.alloc(attrCount * 16);
        const strs: Buffer[] = [];
        attributes.forEach((attr, index) => {
            if (attr.length > 1) {
                const name = Buffer.from(attr[0] + "\0");
                const value = Buffer.from(attr.slice(1) + "\0");
                strs.push(name, value);
                buf.writeBigUInt64LE(BigInt(ptr(name)), index * 16);
                buf.writeBigUInt64LE(BigInt(ptr(value)), index * 16 + 8);
            } else {
                const name = Buffer.from(attr[0] + "\0");
                strs.push(name);
                buf.writeBigUInt64LE(BigInt(ptr(name)), index * 16);
                buf.writeBigUInt64LE(0n, index * 16 + 8);
            }
        });
        const success = foundation.class_addProperty(isClassProperty ? metaClassPtr : newClassPtr, Buffer.from(propName + "\0"), ptr(buf), attrCount);
        if (!success) {
            throw new Error(`Failed to add property ${propName} to class ${name}.`);
        }
    }
    classMethods.forEach(method => addMethod(method, true));
    instanceMethods.forEach(method => addMethod(method, false));
    classProperties.forEach(prop => addProp(prop, true));
    instanceProperties.forEach(prop => addProp(prop, false));
    protocols.forEach(protocol => {
        assertFoundation(foundation);
        const protocolPtr = foundation.objc_getProtocol(Buffer.from(protocol + "\0"));
        if (protocolPtr === 0n) {
            throw new ReferenceError(`Protocol ${protocol} not found.`);
        }
        const success = foundation.class_addProtocol(newClassPtr, protocolPtr);
        if (!success) {
            throw new Error(`Failed to add protocol ${protocol} to class ${name}.`);
        }
    });
    foundation.objc_registerClassPair(newClassPtr);
    return lookupObjCClass(ObjCClass, newClassPtr, name, metaClassPtr);
}

export function isObjCClass(obj: any): obj is typeof ObjCClass {
    return (typeof obj === "function" || (typeof obj === "object" && obj !== null))
        && "__ts_objc_meta" in obj
        && "__ts_objc_ptr" in obj;
}

export function isIdOfClass(obj: ObjCObject | FFITypeToArgsType[FFIType.u64], className: string): boolean {
    assertFoundation(foundation);
    if (obj instanceof ObjCObject) {
        const cls = foundation.object_getClass(obj.__ts_objc_ptr);
        if (!cls) {
            throw new ReferenceError(`Failed to get class of object pointer ${obj.__ts_objc_ptr}.`);
        }
        const name = foundation.class_getName(cls)?.toString();
        return name === className;
    }
    const cls = foundation.object_getClass(obj as FFITypeToArgsType[FFIType.u64]);
    if (!cls) {
        throw new ReferenceError(`Failed to get class of object pointer ${obj}.`);
    }
    const name = foundation.class_getName(cls)?.toString();
    return name === className;
}

//// Vomitter

function sanitizedName(name: string): string {
    return name.replace(/[:\.]/g, "_");
}

export abstract class Vomitter {
    ptr: FFITypeToArgsType[FFIType.u64];
    constructor(ptr: FFITypeToArgsType[FFIType.u64] | null) {
        if (!ptr) {
            throw new Error("Pointer cannot be null.");
        }
        this.ptr = ptr;
    }
    abstract vomitToTypeScript(): string;
    abstract vomitToObject(): unknown;
}

export class PropertyVomitter extends Vomitter {
    name: string;
    className: string;
    getterName: string;
    setterName?: string;
    getterMethodPtr: FFITypeToArgsType[FFIType.u64];
    setterMethodPtr?: FFITypeToArgsType[FFIType.u64];
    readonly: boolean;
    returnType: ObjCType | FFITypeOrString;
    ivarName?: string;
    copy: boolean;
    retain: boolean;
    nonAtomic: boolean;
    dynamic: boolean;
    weak: boolean;
    gc: boolean;
    constructor(ptr: FFITypeToArgsType[FFIType.u64], classPtr: FFITypeToArgsType[FFIType.u64]) {
        super(ptr);
        assertFoundation(foundation);
        this.className = foundation.class_getName(classPtr)?.toString()!;
        this.name = foundation.property_getName(ptr).toString()!;
        this.readonly = foundation.property_copyAttributeValue(ptr, Buffer.from("R\0")) !== null;
        this.getterName = foundation.property_copyAttributeValue(ptr, Buffer.from("G\0"))?.toString() || this.name;
        this.getterMethodPtr = foundation.class_getInstanceMethod(classPtr, foundation.sel_registerName(Buffer.from(this.getterName + "\0")))!;
        if (!this.readonly) {
            this.setterName = foundation.property_copyAttributeValue(ptr, Buffer.from("S\0"))?.toString() || `set${this.name[0]!.toUpperCase()}${this.name.slice(1)}:`;
            this.setterMethodPtr = foundation.class_getInstanceMethod(classPtr, foundation.sel_registerName(Buffer.from(this.setterName + "\0")));
        }
        this.returnType = parseTypeEncoding(foundation.property_copyAttributeValue(ptr, Buffer.from("T\0"))?.toString()!);
        this.ivarName = foundation.property_copyAttributeValue(ptr, Buffer.from("V\0"))?.toString();
        this.copy = foundation.property_copyAttributeValue(ptr, Buffer.from("C\0")) !== null;
        this.retain = foundation.property_copyAttributeValue(ptr, Buffer.from("&\0")) !== null;
        this.nonAtomic = foundation.property_copyAttributeValue(ptr, Buffer.from("N\0")) !== null;
        this.dynamic = foundation.property_copyAttributeValue(ptr, Buffer.from("D\0")) !== null;
        this.weak = foundation.property_copyAttributeValue(ptr, Buffer.from("W\0")) !== null;
        this.gc = foundation.property_copyAttributeValue(ptr, Buffer.from("P\0")) !== null;
    }

    override vomitToTypeScript(): string {
        let func = whichFuncForInvokeInString(this.returnType);
        let ret = typeToReturnTypeTypeScriptTypeString(this.returnType)
        return `
    get ${this.name}(): ${ret} {
        return ${func}(${JSON.stringify(typeToReturnType(this.returnType))}, this, selPtr("${this.getterName}")) as ${ret};
    }`
            + (this.readonly ? "" :
            `
    set ${this.name}(value: ${typeToReturnTypeTypeScriptTypeString(this.returnType)}) {
        ${func}(FFIType.void, this, selPtr("${this.setterName}"), { type: ${JSON.stringify(typeToReturnType(this.returnType))}, value: value });
    }`);
    }

    override vomitToObject() {
        return (cls: _ObjCClass | typeof _ObjCClass) => {
            assertFoundation(foundation);
            let retType = this.returnType;
            let getterSel = selPtr(this.getterName);
            let setterSel = this.setterName ? selPtr(this.setterName) : undefined;
            let ro = this.readonly;
            let func = whichFuncForInvoke(retType);
            Object.defineProperty(cls, this.name, {
                get: function() { return func(retType, this, getterSel); },
                set: function (value) {
                    if (ro) {
                        throw new TypeError(`Property ${this.className}.${this.name} is readonly.`);
                    }
                    func(FFIType.void, this, setterSel!, { type: retType, value: value });
                },
                enumerable: true,
                configurable: true,
            });
            return cls;
        }
    }
}

export abstract class MethodVomitter extends Vomitter {
    sel: FFITypeToArgsType[FFIType.u64];
    name: string;
    selName: string;
    className?: string;
    argNames: string[];
    argsCount: number;
    typeEncodings: (ObjCType | FFITypeOrString)[] = [];
    returnType: ObjCType | FFITypeOrString;
    constructor(ptr: FFITypeToArgsType[FFIType.u64], classPtr?: FFITypeToArgsType[FFIType.u64]) {
        super(ptr);
        this.className = classPtr ? foundation?.class_getName(classPtr)?.toString() : undefined;
        let _sel = foundation?.method_getName(ptr);
        if (!_sel) {
            throw new Error("Failed to get method name.");
        }
        this.sel = _sel;
        let _name = foundation?.sel_getName(this.sel).toString();
        if (_name === undefined) {
            throw new Error("Failed to get selector name.");
        }
        this.name = sanitizedName(_name);
        this.selName = _name;
        this.argNames = _name.split(":").slice(0, -1).map((part, index) => part + "_" + index);
        this.argsCount = foundation?.method_getNumberOfArguments(ptr) ?? 0;
        if (this.argsCount > this.argNames.length) {
            // Generate arg names for any missing ones (e.g. for methods with unnamed parameters)
            for (let i = this.argNames.length; i < this.argsCount - 2; i++) {
                this.argNames.push("arg_" + i);
            }
        }
        for (let i = 2; i < this.argsCount; i++) {
            let typeEncoding = foundation?.method_copyArgumentType(ptr, i).toString();
            if (typeEncoding === undefined) {
                throw new Error(`Failed to get type encoding for argument ${i} of method ${this.name}.`);
            }
            let parsed = parseTypeEncoding(typeEncoding)
            this.typeEncodings.push(parsed);
        }
        let _returnTypeEncoding = foundation?.method_copyReturnType(ptr).toString()
        if (_returnTypeEncoding === undefined) {
            throw new Error(`Failed to get return type encoding for method ${this.name}.`);
        }
        this.returnType = parseTypeEncoding(_returnTypeEncoding);
    }

    vomitToTypeScriptPrototype(isStatic: boolean): string {
        let args = this.argNames.map((arg, index) => `${arg}: ${typeToArgsTypeTypeScriptTypeString(this.typeEncodings[index]!)}`).join(", ");
        let packedArgs = this.typeEncodings.map((type, index) => `{ type: ${JSON.stringify(type)}, value: ${this.argNames[index]} }`).join(", ");
        let func = whichFuncForInvokeInString(this.returnType);
        let ret = typeToReturnTypeTypeScriptTypeString(this.returnType)
        return `
    ${isStatic ? "static " : ""}${this.name}(${args}): ${ret} {
        return ${func}(${JSON.stringify(this.returnType)}, this, selPtr("${this.selName}")${packedArgs ? ", " + packedArgs : ""}) as ${ret};
    }`;
    }

    override vomitToObject(): Function {
        let func = whichFuncForInvoke(this.returnType, this.typeEncodings);
        let retType = this.returnType;
        let sel = this.sel;
        let argTypes = this.typeEncodings;
        return function (this: ObjCObject, ...args: unknown[]) { 
            return func(retType, this, sel, ...args.map((arg, index) => ({ type: argTypes[index]!, value: arg })));
        }
    }
}

export class InstanceMethodVomitter extends MethodVomitter {
    override vomitToTypeScript(): string {
        return this.vomitToTypeScriptPrototype(false);
    }
}

export class ClassMethodVomitter extends MethodVomitter {
    override vomitToTypeScript(): string {
        return this.vomitToTypeScriptPrototype(true);
    }
}

export class ClassVomitter extends Vomitter {
    // cache here
    static classes: Record<string, typeof ObjCClass> = {};
    name: string;
    meta: FFITypeToArgsType[FFIType.u64];
    super?: FFITypeToArgsType[FFIType.u64];
    superName?: string;
    instanceMethods: FFITypeToArgsType[FFIType.u64][] = [];
    classMethods: FFITypeToArgsType[FFIType.u64][] = [];
    instanceMethodVomitters: InstanceMethodVomitter[] = [];
    classMethodVomitters: ClassMethodVomitter[] = [];
    instancePropertyVomitters: PropertyVomitter[] = [];
    classPropertyVomitters: PropertyVomitter[] = [];
    constructor(nameOrPtr: string | FFITypeToArgsType[FFIType.u64]) {
        if (typeof nameOrPtr === "string") {
            const ptr = foundation?.objc_getClass(Buffer.from(nameOrPtr + "\0"));
            if (ptr === null || ptr === undefined) {
                throw new ReferenceError(`Class ${nameOrPtr} not found.`);
            }
            super(ptr);
        } else {
            super(nameOrPtr);
        }
        let _name = foundation?.class_getName(this.ptr)?.toString();
        if (_name === undefined) {
            throw new Error("Failed to get class name.");
        }
        this.name = _name;
        this.meta = foundation?.object_getClass(this.ptr)!;
        this.super = foundation?.class_getSuperclass(this.ptr);
        this.superName = this.super ? foundation?.class_getName(this.super)?.toString() : undefined;
    }

    override vomitToTypeScript(): string {
        let outCount = libc?.malloc(4);
        let methodsPtr = foundation?.class_copyMethodList(this.ptr, outCount!);
        let methodsCount = read.u32(Number(outCount!) as Pointer);
        this.instanceMethodVomitters = Array.from(
            new BigUint64Array(toArrayBuffer(Number(methodsPtr!) as Pointer, 0, methodsCount * 8)),
            (method: bigint): InstanceMethodVomitter => {
                return new InstanceMethodVomitter(method!, this.ptr)
            });
        let classMethodsPtr = foundation?.class_copyMethodList(foundation?.object_getClass(this.ptr)!, outCount!);
        let classMethodsCount = read.u32(Number(outCount!) as Pointer);
        this.classMethodVomitters = Array.from(
            new BigUint64Array(toArrayBuffer(Number(classMethodsPtr!) as Pointer, 0, classMethodsCount * 8)),
            (method: bigint): ClassMethodVomitter => {
                return new ClassMethodVomitter(method!, this.ptr)
            });
        let propertiesPtr = foundation?.class_copyPropertyList(this.ptr, outCount!);
        let propertiesCount = read.u32(Number(outCount!) as Pointer);
        this.instancePropertyVomitters = Array.from(
            new BigUint64Array(toArrayBuffer(Number(propertiesPtr!) as Pointer, 0, propertiesCount * 8)),
            (property: bigint): PropertyVomitter => {
                return new PropertyVomitter(property!, this.ptr);
            });
        let classPropertiesPtr = foundation?.class_copyPropertyList(this.meta, outCount!);
        let classPropertiesCount = read.u32(Number(outCount!) as Pointer);
        this.classPropertyVomitters = Array.from(
            new BigUint64Array(toArrayBuffer(Number(classPropertiesPtr!) as Pointer, 0, classPropertiesCount * 8)),
            (property: bigint): PropertyVomitter => {
                return new PropertyVomitter(property!, this.meta);
            });
        libc?.free(outCount!);
        libc?.free(methodsPtr!);
        libc?.free(classMethodsPtr!);
        libc?.free(propertiesPtr!);
        libc?.free(classPropertiesPtr!);
        const vomitted: string[] = [];
        let imp = ""
        if (this.superName) {
            imp = `import { ${this.superName} } from "./${this.superName}.ts";\n\n`
        }
        // Vomit properties will cause error
        // some base class define a method, but the subclass redefine it as a property...
        return `${imp}export class ${this.name} extends ${this.superName || "ObjCClass"} {
    static override __ts_objc_name = ${JSON.stringify(this.name)};
    static override __ts_objc_ptr = foundation?.objc_getClass(Buffer.from(${JSON.stringify(this.name)} + "\\0"))!;
    static override __ts_objc_meta = foundation?.object_getClass(this.__ts_objc_ptr)!;
    constructor(ptr: FFITypeToArgsType[FFIType.u64]) {
        super(ptr);
    }

    // CLASS_METHODS
${this.classMethodVomitters.map(method =>
    vomitted.find(name => name === "static " + method.name)
        ? ""
        : (() => {
            vomitted.push("static " + method.name);
            return method.vomitToTypeScript();
        })()).filter(str => str.trim() !== "").join("\n")}

    // INSTANCE_METHODS
${this.instanceMethodVomitters.map(method =>
    vomitted.find(name => name === method.name)
        ? ""
        : (() => {
            vomitted.push(method.name);
            return method.vomitToTypeScript();
        })()).filter(str => str.trim() !== "").join("\n")}
}`;
    }

    override vomitToObject(): typeof ObjCClass {
        let ptr = this.ptr;
        let meta = this.meta;
        let name = this.name
        let sup;
        if (this.superName) {
            let supClass = ClassVomitter.classes[this.superName]
            if (supClass) {
                sup = supClass;
            } else {
                sup = new ClassVomitter(this.superName).vomitToObject();
                ClassVomitter.classes[this.superName] = sup;
            }
        }
        let cls = lookupObjCClass(sup || ObjCClass, ptr, name, meta);
        ClassVomitter.classes[this.name] = cls;
        return cls;
    }
}

function vomitHeader(corePath: string): string {
    return `// This file is auto-generated by bun-objc. Do not edit manually.

import { ObjCClass, ObjCSelector, ObjCObject, ObjCId, foundation, objc_msgSend, ns_invoke, selPtr } from "${corePath}";
import { FFIType, type FFITypeToArgsType, type FFITypeToReturnsType } from "bun:ffi";

`
}

/**
 * Convert Obj-C classes to TypeScript definitions and write to files.
 * 
 * [FIXME] no property support for now, as it will cause name conflict with methods.
 * @param dir Directory for class definition files
 * @param classNames Classes to be converted to typescript definitions
 */
export async function vomitClasses(dir: string, classNames?: string[]) {
    await mkdir(dir, { recursive: true });
    const corePath = path.relative(dir, path.resolve(__dirname, "core"));
    if (classNames && classNames.length > 0) {
        const vomitters: ClassVomitter[] = []
        while (classNames.length > 0) {
            const name = classNames.shift()!;
            const vomitter = new ClassVomitter(name);
            vomitters.push(vomitter);
            const superName = vomitter.superName;
            if (superName && !classNames.includes(superName) && !vomitters.find(v => v.name === superName)) {
                classNames.unshift(superName);
            }
        }
        vomitters.map(vomitter => {
            Bun.write(path.resolve(dir, `${vomitter.name}.ts`),
                vomitHeader(corePath) + vomitter.vomitToTypeScript());
        });
    } else {
        listObjCClasses().map(cls => {
            Bun.write(path.resolve(dir, `${cls.__ts_objc_name}.ts`),
                vomitHeader(corePath) + new ClassVomitter(cls.__ts_objc_ptr).vomitToTypeScript());
        });
    }
}

//// core convenience for runtime

/**
 * Find Obj-C class by name or pointer in Obj-C runtime.
 * @param nameOrPtr Obj-C class name or pointer
 * @returns The JS class representing the Obj-C class
 */
export function findObjCClass(nameOrPtr: string | FFITypeToArgsType[FFIType.u64]): typeof ObjCClass {
    assertFoundation(foundation);
    if (typeof nameOrPtr !== "string") {
        let name = foundation.class_getName(nameOrPtr).toString();
        if (name === undefined) {
            throw new Error("Failed to get class name.");
        }
        nameOrPtr = name;
    }
    let cls = ClassVomitter.classes[nameOrPtr];
    if (!cls) {
        let vomitter = new ClassVomitter(nameOrPtr);
        cls = vomitter.vomitToObject();
    }
    return cls;
}

/**
 * Find or register Obj-C selector.
 * @param nameOrPtr Selector name or SEL * pointer
 * @returns The selector
 */
export function findObjCSelector(nameOrPtr: string | FFITypeToArgsType[FFIType.u64]): ObjCSelector {
    if (typeof nameOrPtr !== "string") {
        let name = foundation?.sel_getName(nameOrPtr).toString();
        if (name === undefined) {
            throw new Error("Failed to get selector name.");
        }
        nameOrPtr = name;
    }
    let sel = ObjCSelector.selectors[nameOrPtr];
    if (!sel) {
        sel = new ObjCSelector(nameOrPtr);
        ObjCSelector.selectors[nameOrPtr] = sel;
    }
    return sel;
}

/**
 * List all Obj-C classes.
 * @returns A list of all Obj-C classes in current runtime
 */
export function listObjCClasses(): typeof ObjCClass[] {
    assertFoundation(foundation);
    let count = new Uint32Array(1);
    let classes = foundation.objc_copyClassList(ptr(count));
    let ptrs = toBuffer(Number(classes!) as Pointer, 0, count.at(0)! * 8);
    let result: typeof ObjCClass[] = [];
    for (let i = 0; i < count.at(0)!; i++) {
        let ptr = ptrs.readBigUInt64LE(i * 8);
        result.push(findObjCClass(ptr));
    }
    libc!.free(classes!);
    return result;
}

//// Runtime interface

function _2doubleStructBuf(a: number, b: number): Buffer {
    let buf = Buffer.alloc(16);
    buf.writeDoubleLE(a, 0);
    buf.writeDoubleLE(b, 8);
    return buf;
}

function _4doubleStructBuf(a: number, b: number, c: number, d: number): Buffer {
    let buf = Buffer.alloc(32);
    buf.writeDoubleLE(a, 0);
    buf.writeDoubleLE(b, 8);
    buf.writeDoubleLE(c, 16);
    buf.writeDoubleLE(d, 24);
    return buf;
}

/**
 * Acceptable value type for NS API
 */
export type NSAcceptable = string | number | bigint | boolean
    | ObjCSelector | ObjCObject | ObjCClass | typeof ObjCClass
    | NSAcceptable[] | Map<NSAcceptable, NSAcceptable>
    | null | undefined;

export class _NS {
    /**
     * Get Obj-C class of the object.
     * 
     * 1. If the object is a string, return the class with that name
     * 2. If the object is a number or bigint, treat it as the pointer to the class object
     * 3. If the object is an ObjCObject or ObjCClass, return its class
     * 4. If the object is an ObjCSelector, return the class with the selector name
     * 5. If the object is an Array or Map, return NSArray or NSDictionary class accordingly
     * @param obj The object
     * @returns The Obj-C class of the object, or undefined if not found
     */
    static cls(obj: NSAcceptable): typeof ObjCClass | undefined {
        return typeof obj === "string" || typeof obj === "number" || typeof obj === "bigint"
            ? findObjCClass(obj)
            : obj instanceof ObjCObject || isObjCClass(obj)
                ? findObjCClass(obj.__ts_objc_ptr)
                : obj instanceof ObjCSelector
                    ? findObjCClass(obj.__ts_objc_name)
                    : obj instanceof Array
                        ? findObjCClass("NSArray")
                        : obj instanceof Map
                            ? findObjCClass("NSDictionary")
                            : undefined;
    }

    /**
     * Get or register Obj-C selector.
     * 
     * 1. If the object is a string, return the selector with that name
     * 2. If the object is a number or bigint, treat it as the pointer to the selector
     * 3. If the object is an ObjCSelector, return itself
     * 4. If the object is an NSString, return the selector with the string value
     * @param obj The object
     * @returns The Obj-C selector of the object, or undefined if obj cannot be converted to selector
     */
    static sel(obj: NSAcceptable): ObjCSelector | undefined {
        return typeof obj === "string" || typeof obj === "number" || typeof obj === "bigint"
            ? findObjCSelector(obj)
            : obj instanceof ObjCObject && isIdOfClass(obj, "NSString")
                ? findObjCSelector((obj as any).UTF8String())
                : obj instanceof ObjCSelector
                    ? obj
                    : undefined;
    }

    /**
     * Create NSString from a JavaScript string.
     * @param str The string
     * @returns The NSString
     */
    static str(str: string): ObjCObject {
        return (findObjCClass("NSString") as any).stringWithUTF8String_(Buffer.from(str + "\0")) as ObjCObject;
    }

    /**
     * Create NSNumber from a JavaScript number or bigint.
     * @param num The number
     * @returns The NSNumber
     */
    static num(num: number | bigint): ObjCObject {
        if (typeof num === "number") {
            return (findObjCClass("NSNumber") as any).numberWithDouble_(num) as ObjCObject;
        } else {
            return (findObjCClass("NSNumber") as any).numberWithLongLong_(num) as ObjCObject;
        }
    }

    /**
     * Convert a JavaScript value to an Objective-C object.
     * @param obj The value
     * @returns The Objective-C object, class, or undefined if conversion is impossible
     */
    static toObj(obj: NSAcceptable): ObjCObject | typeof ObjCClass | undefined {
        if (typeof obj === "string") {
            return _NS.str(obj);
        } else if (typeof obj === "number" || typeof obj === "bigint") {
            return _NS.num(obj);
        } else if (obj instanceof ObjCSelector) {
            return _NS.str(obj.__ts_objc_name);
        } else if (obj instanceof ObjCObject || isObjCClass(obj)) {
            return obj;
        } else if (obj instanceof Array) {
            return _NS.arr(...obj);
        } else if (obj instanceof Map) {
            return _NS.dict(obj);
        } else {
            return undefined;
        }
    }

    /**
     * Create an NSArray from JavaScript Array.
     * @param items An Array
     * @returns A NSArray
     */
    static arr(...items: NSAcceptable[]): ObjCObject {
        const arr = BigUint64Array
            .from(items
                .map(item => _NS.toObj(item)
                    ?.__ts_objc_ptr
                    ?? (() => { throw new TypeError(`Cannot convert ${item} to Objective-C object pointer.`) })()));
        return (_NS.cls("NSArray") as any).arrayWithObjects_count_(ptr(arr), items.length) as ObjCObject;
    }

    /**
     * Create an NSDictionary from JavaScript Map.
     * @param obj A Map
     * @returns A NSDictionary
     */
    static dict(obj?: Map<NSAcceptable, NSAcceptable>): ObjCObject {
        if (!obj) {
            return (_NS.cls("NSDictionary") as any).dictionary() as ObjCObject;
        }
        let err = (value: NSAcceptable) => { throw new TypeError(`Cannot convert ${value} to Objective-C object pointer.`) };
        let objptr = (x: NSAcceptable) => _NS.toObj(x)?.__ts_objc_ptr ?? err(x);
        let keys = BigUint64Array.from(obj.keys().toArray().map(objptr));
        let values = BigUint64Array.from(obj.values().toArray().map(objptr));
        return (_NS.cls("NSDictionary") as any).dictionaryWithObjects_forKeys_count_(ptr(values), ptr(keys), obj.size) as ObjCObject;
    }

    /**
     * Create NSPoint / CGPoint
     * @param x x
     * @param y y
     * @returns A Buffer that can be passed as NSPoint or CGPoint
     */
    static point(x: number, y: number): Buffer {
        return _2doubleStructBuf(x, y);
    }

    /**
     * Create NSSize / CGSize
     * @param width width
     * @param height height
     * @returns A Buffer that can be passed as NSSize or CGSize
     */
    static size(width: number, height: number): Buffer {
        return _2doubleStructBuf(width, height);
    }

    /**
     * Create NSRect / CGRect
     * @param x x
     * @param y y
     * @param width width
     * @param height height
     * @returns A Buffer that can be passed as NSRect or CGRect
     */
    static rect(x: number, y: number, width: number, height: number): Buffer {
        return _4doubleStructBuf(x, y, width, height);
    }

    // Some objc enums.
    // [TODO] There are too many enums.
    // Considering using LLVM API to parse Xcode SDK headers to generate them.

    static WindowStyleMask = {
        borderless: 0,
        titled: 1 << 0,
        closable: 1 << 1,
        miniaturizable: 1 << 2,
        resizable: 1 << 3,
        texturedBackground: 1 << 4,
        unifiedTitleAndToolbar: 1 << 5,
        fullScreen: 1 << 6,
        fullSizeContentView: 1 << 7,
        utilityWindow: 1 << 8,
        docModalWindow: 1 << 9,
        nonactivatingPanel: 1 << 10,
        hudWindow: 1 << 11,
    }

    static BackingStoreType = {
        retained: 0,
        nonRetained: 1,
        buffered: 2,
    }

    static PasteboardReadingOptions = {
        data: 0,
        string: 1,
        propertyList: 2,
        keyedArchive: 3,
    }

    static FontTrait = {
        italic: (1 << 0),
        bold: (1 << 1),
        expanded: (1 << 5),
        condensed: (1 << 6),
        monoSpace: (1 << 10),
        vertical: (1 << 11),
        uiOptimized: (1 << 12)
    };
    
    static EventType = {
        leftMouseDown: 1,
        leftMouseUp: 2,
        rightMouseDown: 3,
        rightMouseUp: 4,
        mouseMoved: 5,
        leftMouseDragged: 6,
        rightMouseDragged: 7,
        mouseEntered: 8,
        mouseExited: 9,
        keyDown: 10,
        keyUp: 11,
        flagsChanged: 12,
        appKitDefined: 13,
        systemDefined: 14,
        applicationDefined: 15,
        periodic: 16,
        cursorUpdate: 17,
        scrollWheel: 22,
        tabletPoint: 23,
        tabletProximity: 24,
        otherMouseDown: 25,
        otherMouseUp: 26,
        otherMouseDragged: 27,
        gesture: 29,
        magnify: 30,
        swipe: 31,
        rotate: 18,
        beginGesture: 19,
        endGesture: 20,
        smartMagnify: 32,
        quickLook: 33,
        pressure: 34,
        directTouch: 37,
        changeMode: 38,
        mouseCancelled: 40,
    }
}

const handler: ProxyHandler<typeof _NS> = {
    get(target, prop) {
        if (prop in target) {
            return (target as any)[prop];
        }
        const cls = findObjCClass(prop.toString());
        if (cls) {
            (target as any)[prop] = cls;
            return cls;
        }
        return undefined;
    }
}

/**
 * The NeXTSTEP. Primary interface for Obj-C runtime interaction.
 */
export const NS = new Proxy(_NS, handler) as typeof _NS & {
    [key: string]: typeof ObjCClass | undefined;
};

/**
 * Load all Obj-C classes in the runtime and attach them to NS object.
 * Not recommended for production due to performance reasons.
 * You can use findObjCClass or NS["ClassName"] to get a specific class without loading all classes.
 */
export function loadClasses() {
    listObjCClasses().map(cls => {
        (NS as any)[cls.__ts_objc_name] = cls;
    });
}

// load()