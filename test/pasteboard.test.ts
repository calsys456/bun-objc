import { expect, test } from "bun:test";
import { load, NS } from "../core";

test("Write to pasteboard", () => {
    load();
    const pboard = NS.NSPasteboard?.generalPasteboard;
    pboard?.clearContents();
    expect(pboard?.writeObjects_(NS.arr("Hello from bun-objc!"))).toBeTrue();
});

test("Read pasteboard", () => {
    load();
    expect(NS.NSPasteboard?.generalPasteboard
        .readObjectsForClasses_options_(NS.arr(NS.cls("NSString")), NS.dict()) 
        .objectAtIndex_(0)
        .UTF8String()
        .toString())
        .toBe("Hello from bun-objc!");
});