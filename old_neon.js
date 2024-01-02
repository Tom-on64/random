let program;
let LCls;
let LAtr;
let isDebug = false;
const builtIn = {
    Base: {
        "void:Log": ([msg]) => {
            let type = msg.Type;
            let value = msg.Value;
            if (msg.Type == "var") {
                type = msg.Value.split(":")[0].replace("#", "");
                value = program.classes[LCls].attributes[msg.Value];
            }
            if (type != "string" && type != "int")
                error(`'${msg.Value}' must be string, int or var!`, 202);
            else
                console.log(
                    `\u001b[35m[\u001b[33mOUT\u001b[35m] \u001b[31m> \u001b[32m${value}\u001b[0m`
                );
        },
    },
    Math: {
        "void:Add": ([a, b]) => {
            let va = a.Value;
            let ta = a.Type;
            let vb = b.Value;
            let tb = b.Type;
            if (a.Type == "var") {
                if (!program.classes[LCls].attributes[a.Value])
                    error("Attribute " + a.Value + " does not exist", 201);
                else {
                    va = program.classes[LCls].attributes[a.Value];
                    ta = a.Value.split(":")[0].replace("#", "");
                }
            }
            if (b.Type == "var") {
                if (!program.classes[LCls].attributes[b.Value])
                    error("Attribute " + b.Value + " does not exist", 201);
                else {
                    vb = program.classes[LCls].attributes[b.Value];
                    tb = b.Value.split(":")[0].replace("#", "");
                }
            }
            if (!program.classes[LCls])
                error("Class " + LCls + " does not exist!", 200);
            else if (ta != "int")
                error(`${va}(${ta}) is not of type int!`, 202);
            else if (tb != "int")
                error(`${vb}(${tb}) is not of type int!`, 202);
            else {
                let sum = parseInt(va) + parseInt(vb);
                program.classes[LCls].attributes[a.Value] = sum;
            }
        },
    },
};
const error = (msg, code) => {
    console.error(
        `\u001b[35m[\u001b[31mERR\u001b[35m] \u001b[31m> \u001b[31m${msg} \u001b[1m[NE${code}]\u001b[0m`
    );
};
const lexer = (code) => {
    code = code.replaceAll(";", " ");
    code = code.replaceAll(",", " ");
    code = code.replaceAll("}", " }");
    code = code.replaceAll("\n", "");
    code = code.replaceAll(/\s\s+/g, " ");
    let codeList = code.split(" ");
    codeList.push("#EOF");
    let mode = "normal";

    const program = {
        classes: {},
    };

    let temp = [];
    let i = 0;

    if (isDebug)
        console.log(
            `\u001b[35m[\u001b[33mCMP\u001b[35m] \u001b[31m> \u001b[33m${code}\u001b[0m`
        );

    codeList.forEach((w) => {
        if (isDebug)
            console.log(
                `\u001b[35m[\u001b[34mLEX\u001b[35m] \u001b[31m> \u001b[36m${w} \u001b[33m: \u001b[32m${mode}   \u001b[31m<${temp}> ${i}\u001b[0m`
            );
        i++;
        if (mode == "normal") {
            if (w == "class") mode = "defClass";
            else if (w == "#EOF") mode = "EOF";
            else error(`W:${i} ${w} is not defined!`, 203)
        } else if (mode == "defClass") {
            let classDef;
            if (w == "{") {
                mode = "inClass";
                return;
            }
            if (w.includes("{")) classDef = w.split("{")[0];
            else classDef = w;
            program.classes[classDef] = {
                attributes: {},
            };
            temp[0] = classDef;
            if (w.includes("{")) mode = "inClass";
            else mode = "defClass";
        } else if (mode == "inClass") {
            let attrDef;
            if (w.includes("}")) {
                mode = "normal";
                if (w == "}") return;
                w.replace("}", "");
            }
            if (w == "private") attrDef = "#";
            else if (w == "public") attrDef = "";
            temp[1] = attrDef;
            mode = "defAttr";
        } else if (mode == "defAttr") {
            let attrDef = temp[1];
            if (w == "void") mode = "defVoid";
            if (attrDef.includes(":")) {
                attrDef = attrDef + w;
                program.classes[temp[0]].attributes[attrDef] = null;
                mode = "defAttrVal";
            } else attrDef = attrDef + w + ":";
            temp[1] = attrDef;
        } else if (mode == "defAttrVal") {
            if (w == "=") temp[2] = true;
            else if (temp[2]) {
                program.classes[temp[0]].attributes[temp[1]] = parseInt(w);
                temp[2] = undefined;
                temp[1] = undefined;
                mode = "inClass";
            } else mode = "inClass";
        } else if (mode == "defVoid") {
            let attrDef = temp[1];
            attrDef = attrDef + w.replace("(", "").replace(")", "");
            program.classes[temp[0]].attributes[attrDef] = [];
            temp[1] = attrDef;
            mode = "inVoid";
        } else if (mode == "inVoid") {
            if (w.includes("{")) {
                mode = "defVoidVal";
                if (w == "{") return;
                w.replace("{");
            } else if (w.includes("}")) {
                mode = "inClass";
                if (w == "}") return;
                w.replace("}");
            }
        } else if (mode == "defVoidVal") {
            let ff = false;
            let reset = false;
            if (w.includes("}")) ff = true;
            if (w == "}") {
                mode = "inClass";
                return;
            }
            if (!temp[2]) {
                let method;
                if (w.includes("(")) {
                    method = w.split("(")[0];
                    w = w.split("(")[1];
                    temp[2] = true;
                } else method = w;
                temp[3] =
                    program.classes[temp[0]].attributes[temp[1]].push({
                        Run: method,
                        Args: [],
                    }) - 1;
            }
            if (w.includes(")")) {
                mode = "defVoidVal";
                reset = true;
                if (w == ")") {
                    temp = [temp[0], temp[1]];
                    return;
                }
                w = w.replace(")", "");
            }
            if (w.includes("(")) {
                temp[2] = true;
                if (w == "(") return;
                w = w.replace("(");
            }
            if (temp[2]) {
                if (w.includes('"') || temp[5]) {
                    if (temp[5]) {
                        if (!w.includes('"')) {
                            temp[4] = temp[4] + " " + w;
                            return;
                        }
                        w = w.replace('"', "");
                        program.classes[temp[0]].attributes[temp[1]][
                            temp[3]
                        ].Args.push({
                            Type: "string",
                            Value: temp[4] + " " + w,
                        });
                        temp[5] = undefined;
                        temp[4] = undefined;
                    } else {
                        temp[4] = w;
                        w = w.replace('"', "");
                        if (w.includes('"')) {
                            w = w.replace('"', "");
                            program.classes[temp[0]].attributes[temp[1]][
                                temp[3]
                            ].Args.push({
                                Type: "string",
                                Value: w,
                            });
                            temp[5] = undefined;
                            temp[4] = undefined;
                        }
                        temp[4] = w;
                        temp[5] = true;
                    }
                } else if (w.includes("$")) {
                    w = w.replace("$", "");
                    let val = null;
                    let keys = Object.keys(program.classes[temp[0]].attributes);
                    for (let i in keys) {
                        let k = keys[i].split(":");
                        if (k[1] == w) {
                            val = keys[i];
                        }
                    }
                    program.classes[temp[0]].attributes[temp[1]][
                        temp[3]
                    ].Args.push({ Type: val ? "var" : "null", Value: val });
                } else if (w == parseInt(w)) {
                    program.classes[temp[0]].attributes[temp[1]][
                        temp[3]
                    ].Args.push({ Type: "int", Value: parseInt(w) });
                } else if (w == "Null")
                    program.classes[temp[0]].attributes[temp[1]][
                        temp[3]
                    ].Args.push({ Type: "null", Value: null });
            }
            if (reset) temp = [temp[0], temp[1]];
            if (ff) mode = "inClass";
        } else mode = "normal";
    });

    return program;
};
const neon = (code, main, debug = false) => {
    isDebug = debug;
    if (!code) {
        error("No code was entered!", 104);
        return;
    } else if (!main) {
        error("No MAIN was entered!", 105);
        return;
    }
    try {
        program = lexer(code);
    } catch (e) {
        if (isDebug) error("JS Error: \n" + e, 300);
        else error("JS Error: " + e.message.split("\n")[0], 300);
        return;
    }
    if (isDebug) console.log(
        `\u001b[35m[\u001b[33mDEV\u001b[35m] \u001b[31m> \u001b[33m${JSON.stringify(
            program
        )}\u001b[0m`
    );
    let BIClasses = Object.keys(builtIn);
    BIClasses.forEach((k) => (program.classes[k] = builtIn[k]));
    if (!main.includes(".")) {
        error("Main has to be an attribute of a class!", 103);
        return 100;
    }
    main = main.split(".");
    if (!program.classes[main[0]]) error("Main class does not exist!", 100);
    else if (program.classes[main[0]].attributes["void:" + main[1]])
        error("Main class must be private!", 102);
    else if (!program.classes[main[0]].attributes["#void:" + main[1]])
        error("Main attribute does not exist!", 101);
    else run(main[0], "#void:" + main[1]);
};
const run = (cls, atr, args = []) => {
    let isBuiltIn = false;
    let BIClasses = Object.keys(builtIn);
    if (isDebug)
        console.log(
            `\u001b[35m[\u001b[36mRUN\u001b[35m] \u001b[31m> \u001b[32m${cls}.${atr}(${JSON.stringify(
                args
            )})\u001b[0m`
        );
    BIClasses.forEach((c) => {
        if (cls === c) isBuiltIn = true;
    });
    if (isBuiltIn) {
        if (!program.classes[cls][atr])
            error("BuitIn attribute does not exist", 211);
        else program.classes[cls][atr](args);
    } else if (!program.classes[cls])
        error("Class " + cls + " does not exist!", 200);
    else if (!program.classes[cls].attributes[atr])
        error("Attribute " + atr + " does not exist!", 201);
    else {
        LCls = cls;
        LAtr = atr;
        program.classes[cls].attributes[atr].forEach((p) => {
            let c = p.Run.split(".")[0];
            let a = "void:" + p.Run.split(".")[1];
            if (cls == c) a = "#" + a;
            run(c, a, p.Args);
        });
    }
};
export default neon;
