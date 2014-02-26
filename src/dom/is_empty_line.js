wysihtml5.dom.isEmptyLine = function(node, nonEmptyLineSelectors) {
  var
      parentParagraph = this.getParentElement(node, {nodeName: 'P'}, 10);
  if (parentParagraph === null) {
    return false;
  }
  var
      trimmedText = parentParagraph.textContent.trim(),
      testInvisibleRegex = new RegExp('^' + wysihtml5.INVISIBLE_SPACE + '+$'),
      isEmptyLineBySelector = (nonEmptyLineSelectors && typeof(nonEmptyLineSelectors.join) === "function")?
        parentParagraph.querySelector(nonEmptyLineSelectors.join()) === null
        : true;

  //console.log("inner", inner, parent);
  var retVal = isEmptyLineBySelector
          && (trimmedText === "" || testInvisibleRegex.test(trimmedText));

  return retVal;
};