/**
 * Flatten dom structure
 */
(function(wysihtml5) {
  
  wysihtml5.dom.flatten = function(body) {
    var firstLevelElements = body.childNodes;
    
    for(var i = 0; i < firstLevelElements.length; i++) {
      doFlatten(firstLevelElements[i]);
    }
  };
  
  function doFlatten(node) {
    var children = getChildNodes(node, [wysihtml5.ELEMENT_NODE]);
    
    if(children.length > 0) {
      for(var i = 0; i < children.length; i++) {
        doFlatten(children[i]);
      }
      return;
    }
    
   
    var
      currentNode = node,
      parentNode = node.parentNode;
    while(parentNode.nodeName === currentNode.nodeName) {      
      var
        currentClass = currentNode.className,
        parentClass = parentNode.className,
        mergedClass = mergeClassNames(currentClass, parentClass);
        
        parentNode.className = mergedClass;
        parentNode.innerHTML = currentNode.innerHTML;
        
        currentNode = parentNode;
        parentNode = currentNode.parentNode;
    }
  }
  
  function getChildNodes(node, types) {
    var children = [];
    
    for(var i = 0; i < node.childNodes.length; i++) {      
      if(types.indexOf(node.childNodes[i].nodeType) >= 0) {
        children.push(node.childNodes[i]);
      }
    }
    
    return children;
  }
  
  function mergeClassNames(class1, class2) {
    var
      cl1 = class1.trim().split(" "),
      cl2 = class2.trim().split(" ");
      
    for(var i = 0; i < cl2.length; i++) {
      if(cl1.indexOf(cl2[i]) < 0) {
        cl1.push(cl2[i]);
      }
    }
    
    return cl1.join(" ");
  }
  
})(wysihtml5);