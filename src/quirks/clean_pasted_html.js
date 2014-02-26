/**
 * Fix most common html formatting misbehaviors of browsers implementation when inserting
 * content via copy & paste contentEditable
 *
 * @author Christopher Blum
 */
wysihtml5.quirks.cleanPastedHTML = (function() {
  // TODO: We probably need more rules here
  var defaultRules = {
    // When pasting underlined links <a> into a contentEditable, IE thinks, it has to insert <u> to keep the styling
    "a u": wysihtml5.dom.replaceWithChildNodes
  };
  
  function cleanPastedHTML(elementOrHtml, rules, context) {
    rules   = rules || defaultRules;
    context = context || elementOrHtml.ownerDocument || document;
    
    var element,
        isString = typeof(elementOrHtml) === "string",
        method,
        matches,
        matchesLength,
        i;
    if (isString) {
      element = wysihtml5.dom.getAsDom(elementOrHtml, context);
    } else {
      element = elementOrHtml;
    }
//    console.log('Before cleanup:' + element.outerHTML);
    for (i in rules) {
      matches       = element.querySelectorAll(i);
      method        = rules[i];
      matchesLength = matches.length;
//      console.log("Rule: \"" + i + "\" matches " + matchesLength + " elements.");
      for (var j = 0; j<matchesLength; j++) {
        method(matches[j]);
      }
//      console.log('After rule:' + element.outerHTML);
    }
//    console.log('After cleanup:' + element.outerHTML);
    matches = elementOrHtml = rules = null;
    
    return isString ? element.innerHTML : element;
  }
  
  return cleanPastedHTML;
})();