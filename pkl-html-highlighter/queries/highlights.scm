; hljs scopes: https://highlightjs.readthedocs.io/en/stable/css-classes-reference.html#a-note-on-scopes-with-sub-scopes

; Types

(clazz (identifier) @title.class)
(typeAlias (identifier) @title.class)
((identifier) @title.class
 (match? @title.class "^[A-Z]"))

(typeArgumentList
  "<" @punctuation
  ">" @punctuation)

; Method calls

(methodCallExpr
  (identifier) @title.function.invoke)

; Method definitions

(classMethod (methodHeader (identifier) @title.function))
(objectMethod (methodHeader (identifier) @title.function))

; Identifiers

(classProperty (identifier) @variable)
(objectProperty (identifier) @variable)

(parameterList (typedIdentifier (identifier) @params))
(objectBodyParameters (typedIdentifier (identifier) @params))

(identifier) @variable

; Literals

(stringConstant) @string
(slStringLiteral) @string
(mlStringLiteral) @string

(escapeSequence) @char.escape

(intLiteral) @number
(floatLiteral) @number

(interpolationExpr
  "\\(" @char.escape
  ")" @char.escape) @subst

(interpolationExpr
 "\\#(" @char.escape
 ")" @char.escape) @subst

(interpolationExpr
  "\\##(" @char.escape
  ")" @char.escape) @subst

(lineComment) @comment
(blockComment) @comment
(docComment) @comment

(annotation (qualifiedIdentifier) @attribute)

; Operators

"??" @operator
"@"  @operator
"="  @operator
"<"  @operator
">"  @operator
"!"  @operator
"==" @operator
"!=" @operator
"<=" @operator
">=" @operator
"&&" @operator
"||" @operator
"+"  @operator
"-"  @operator
"**" @operator
"*"  @operator
"/"  @operator
"~/" @operator
"%"  @operator
"|>" @operator

"?"  @operator
"|"  @operator
"->" @punctuation

"," @punctuation
":" @punctuation
"." @punctuation
"?." @punctuation
"..."  @punctuation
"...?" @punctuation

"(" @punctuation
")" @punctuation
; "[" @punctuation
"]" @punctuation
"{" @punctuation
"}" @punctuation

; Keywords

"abstract" @keyword
"amends" @keyword
"as" @keyword
"class" @keyword
"else" @keyword
"extends" @keyword
"external" @keyword
(falseLiteral) @literal
(trueLiteral) @literal
(nullLiteral) @literal
"for" @keyword
"function" @keyword
"hidden" @keyword
"if" @keyword
(importExpr "import" @built_in)
(importGlobExpr "import*" @built_in)
"import" @keyword
"import*" @keyword
"in" @keyword
"is" @keyword
"let" @keyword
"local" @keyword
(moduleExpr "module" @type)
"new" @keyword
"nothing" @type
"open" @keyword
"out" @keyword
"module" @keyword
(outerExpr) @keyword
(thisExpr) @keyword
"super" @keyword
"read" @built_in
"read?" @built_in
"read*" @built_in
"throw" @built_in
"trace" @built_in
"typealias" @keyword
"unknown" @type
"when" @keyword
