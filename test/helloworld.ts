import { FFIType } from "bun:ffi";
import { load, NS, ObjCType, subclassing } from "../core";

// A simple test copied from https://github.com/gammasoft71/Examples_Cocoa

load();

const Window = subclassing({
    name: "Window",
    superClass: NS.NSWindow,
    instanceProperties: [{ name: "label", type: ObjCType.id }],
    instanceMethods: [
        {
            name: "init",
            args: [],
            returnType: ObjCType.id,
            impl: function (this: InstanceType<typeof Window>) {
                this.label = NS.NSTextField?.alloc().initWithFrame_(NS.rect(5, 100, 290, 100));
                this.label.setStringValue_(NS.str("Hello, World!"));
                this.label.setBezeled_(false);
                this.label.setDrawsBackground_(false);
                this.label.setEditable_(false);
                this.label.setSelectable_(false);
                this.label.setTextColor_(NS.NSColor?.colorWithSRGBRed_green_blue_alpha_(0.0, 0.5, 0.0, 1.0));
                const fontManager = NS.NSFontManager?.sharedFontManager;
                const font = fontManager
                    ?.convertFont_toHaveTrait_(fontManager
                        ?.convertFont_toHaveTrait_(NS.NSFont
                            ?.fontWithName_size_("Helvetica", 45)
                            , NS.FontTrait.bold)
                        , NS.FontTrait.italic);
                this.label.setFont_(font);
                this.initWithContentRect_styleMask_backing_defer_(
                    NS.rect(0, 0, 300, 300),
                    NS.WindowStyleMask.titled | NS.WindowStyleMask.closable | NS.WindowStyleMask.miniaturizable | NS.WindowStyleMask.resizable,
                    NS.BackingStoreType.buffered,
                    false
                );
                this.setTitle_(NS.str("Hello bun-objc!"));
                this.contentView?.addSubview_(this.label);
                this.center();
                this.setIsVisible_(true);
                return this;
            }
        },
        {
            name: "window",
            args: [{ name: "ShouldClose", type: ObjCType.id }],
            returnType: FFIType.bool,
            impl: function (sender) {
                console.log("Bye-bye!");
                return true;
            }
        }
    ]
});

const AppDelegate = subclassing({
    name: "AppDelegate",
    superClass: NS.NSObject,
    protocols: ["NSApplicationDelegate"],
    instanceMethods: [
        {
            name: "application",
            args: [{ name: "ShouldTerminateAfterLastWindowClosed", type: ObjCType.id }],
            returnType: FFIType.bool,
            impl: function () {
                return true;
            }
        }
    ]
});

const app = NS.NSApplication?.sharedApplication;
const delegate = AppDelegate?.alloc().init();
app?.setDelegate_(delegate);
Window?.alloc().init().autorelease().makeMainWindow();
app.performSelector_withObject_afterDelay_("terminate:", app, 3);
app.run();