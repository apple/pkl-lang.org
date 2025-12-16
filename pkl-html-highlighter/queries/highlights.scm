; hljs scopes: https://highlightjs.readthedocs.io/en/stable/css-classes-reference.html#a-note-on-scopes-with-sub-scopes

; Types

(clazz (identifier) @title.class)
(typeAlias (identifier) @title.class)
((identifier) @title.class
  (#match? @title.class "^[A-Z]"))

(typeArgumentList
  "<" @punctuation
  ">" @punctuation)

; Method calls

(qualifiedAccessExpr
  (identifier) @variable)

(qualifiedAccessExpr
  (identifier) @title.function.invoke (argumentList))

(unqualifiedAccessExpr
  (identifier) @title.function.invoke (argumentList))

; Method definitions

(classMethod (methodHeader (identifier) @title.function))
(objectMethod (methodHeader (identifier) @title.function))

; Identifiers

(classProperty (identifier) @property)
(objectProperty (identifier) @property)

(parameterList (typedIdentifier (identifier) @params))
(objectBodyParameters (typedIdentifier (identifier) @params))

; Literals

(stringConstant) @string
(slStringLiteralExpr) @string
(mlStringLiteralExpr) @string

(escapeSequence) @char.escape

(intLiteralExpr) @number
(floatLiteralExpr) @number

(stringInterpolation
  "\\(" @char.escape
  ")" @char.escape) @subst

(stringInterpolation
  "\\#(" @char.escape
  ")" @char.escape) @subst

(stringInterpolation
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
(falseLiteralExpr) @literal
(trueLiteralExpr) @literal
(nullLiteralExpr) @literal
"for" @keyword
"function" @keyword
"hidden" @keyword
"fixed" @keyword
"const" @keyword
"if" @keyword
(importExpr "import" @built_in)
(importExpr "import*" @built_in)
"import" @keyword
"import*" @keyword
"in" @keyword
"is" @keyword
"let" @keyword
"local" @keyword
(moduleExpr "module" @type)
"new" @keyword
(nothingType) @type
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
(unknownType) @type
"when" @keyword
