function skipSpace(string) {
	var first = string.search(/\S/);
	if (first == -1) return "";
	return string.slice(first);
}

function parseExpression(program) {
	// console.log("parseExpression: " + program)
	program = skipSpace(program);
	var match, expr;
	if (match = /^"([^"]*)"/.exec(program)) {
		expr = {type: "value", value: match[1]};
	} else if (match = /^\d+\b/.exec(program)) {
		expr = {type: "value", value: Number(match[0])};
	} else if (match = /^[^\s(),"]+/.exec(program)) {
		expr = {type: "word", value: match[0]};
	} else 
		throw new SyntaxError("Unexpected syntax: " + program);

	return parseApply(expr, program.slice(match[0].length));
}

function parseApply(expr, program) {
	// console.log("parseApply: " + expr + ", " + program);
	program = skipSpace(program)
	if (program[0] != "(")
		return {expr: expr, rest: program}

	program = skipSpace(program.slice(1));
	expr = {type: "apply", operator: expr, args: []};
	while (program[0] != ")") {
		var arg = parseExpression(program);
		expr.args.push(arg.expr);
		program = skipSpace(arg.rest);
		if (program[0] == ",") {
			program = skipSpace(program.slice(1));
		} else if (program[0] != ")") {
			throw new SyntaxError("Expected ',' or ')'");
 		}
	}

	return parseApply(expr, program.slice(1));
}

function parse(program) {
	var result = parseExpression(program);
	if (skipSpace(result.rest).length > 0) {
		throw new SyntaxError("Unexpected text after program");
	}
	return result.expr;
}

var topEnv = Object.create(null);
topEnv[true] = true;
topEnv[false] = false;

["+", "-", "*", "/", "%", "==", "<", ">"].forEach(function(op) {
	topEnv[op] = new Function("a,b", "return a " + op + "b");
});

var specialFunctions = {};
specialFunctions["if"] = function(args, env) {
	if (args.length != 3) {
		throw new SyntaxError("if has wrong number of arguments");
	}

	if (evaluate(args[0], env)) {
		return evaluate(args[1], env);
	} else {
		return evaluate(args[2], env);
	}
};

specialFunctions["while"] = function(args, env) {
	if (args.length != 2) {
		throw new SyntaxError("while has wrong number of arguments");
	}

	while (evaluate(args[0], env)) {
		evaluate(args[1], env);
	}
	return false;
}

// TODO do
// TODO define
// TODO functions

function evaluate(expr, env) {
	if (expr.type === "value") {
		return expr.value;
	} else if (expr.type === "word") {
		return env[expr.value]
	} else if (expr.type === "apply") {
		if (expr.operator.value in specialFunctions) {
			return specialFunctions[expr.operator.value](expr.args, env);
		} else {
			var op = env[expr.operator.value];
			var args = expr.args.map(function(a) { return evaluate(a, env); })
			return op.apply(null, args);
		}
	} else {
		throw new SyntaxError("Unexpected expression type: " + expr.type);
	}
}

// TODO program to sum
var p = parse("if(false,1,while(false,1))");
topEnv["a"] = 1;
var result = evaluate(p, topEnv);
console.log(result);
